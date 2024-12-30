const axios = require('axios');
const { cache } = require('../utils/cache');

class BinancePriceService {
  constructor() {
    this.PER_PAGE = 20;
    this.BASE_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
    this.SPOT_URL = 'https://api.binance.com/api/v3/ticker/price';
    this.MIN_PRICE_POINTS = 10;
    this.MAX_PRICE_POINTS = 25;
    this.MAX_RETRIES = 2;
    this.RETRY_DELAY = 3000;
    this.CACHE_TTL = 1800; // 30 minutes
    this.MAX_CONCURRENT_REQUESTS = 1;
    this.cleanupSolanaCache();
    this.priceFailureLog = [];
    this.MAX_FAILURE_LOG_SIZE = 1000; // Keep last 1000 failures
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async searchBinanceWithRetry(token, fiat, type, page = 1) {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post(this.BASE_URL, {
          fiat,
          page,
          rows: this.PER_PAGE,
          asset: token,
          tradeType: type,
          searchType: "FAST",
        });
        return response.data;
      } catch (error) {
        console.error(`Binance API error (attempt ${attempt}/${this.MAX_RETRIES}):`, error.message);
        if (attempt < this.MAX_RETRIES) {
          await this.sleep(this.RETRY_DELAY);
        } else {
          throw error;
        }
      }
    }
  }

  async fetchSOLPrices(fiat, type) {
    try {
      const cacheKey = `_solanaCalculations/SOL/${fiat}/${type}`;
      const cachedPrice = cache.get(cacheKey);
      
      if (typeof cachedPrice === 'number' && !isNaN(cachedPrice)) {
        console.log(`Returning cached SOL price for ${fiat}/${type}:`, cachedPrice);
        return cachedPrice;
      }

      // Ensure we have both required prices before calculation
      const [usdtResults, solUsdPrice] = await Promise.all([
        this.ensureUSDTPrices(fiat, type),
        this.ensureSOLUSDPrice()
      ]);

      if (!usdtResults || !solUsdPrice) {
        this.logPriceFailure({
          token: 'SOL',
          fiat,
          type,
          reason: 'Missing required prices',
          details: {
            hasUsdtResults: !!usdtResults,
            hasSolUsdPrice: !!solUsdPrice,
            usdtResults,
            solUsdPrice
          }
        });
        return null;
      }

      // Calculate and verify the result
      const medianIndex = Math.floor(usdtResults.length / 2);
      const medianPrice = usdtResults[medianIndex];
      const decimalPlaces = ['COP', 'VES', 'KES'].includes(fiat.toUpperCase()) ? 2 : 4;
      const calculated = Number((medianPrice * solUsdPrice).toFixed(decimalPlaces));

      if (isNaN(calculated) || calculated <= 0) {
        this.logPriceFailure({
          token: 'SOL',
          fiat,
          type,
          reason: 'Invalid calculation result',
          details: { medianPrice, solUsdPrice, calculated }
        });
        return null;
      }

      // Store the calculated price directly as a number
      const cacheSuccess = cache.set(cacheKey, calculated, this.CACHE_TTL);
      if (!cacheSuccess) {
        this.logPriceFailure({
          token: 'SOL',
          fiat,
          type,
          reason: 'Failed to cache calculation',
          details: { cacheKey, calculated }
        });
      } else {
        console.log(`Successfully cached SOL price for ${fiat}/${type}:`, calculated);
      }

      return calculated;
    } catch (error) {
      this.logPriceFailure({
        token: 'SOL',
        fiat,
        type,
        reason: 'Error in fetchSOLPrices',
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  async ensureUSDTPrices(fiat, type) {
    const cacheKey = `prices/USDT/${fiat}/${type}`;
    let prices = cache.get(cacheKey);
    
    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      console.log(`Fetching fresh USDT prices for ${fiat}/${type}`);
      prices = await this._fetchFreshPrices('USDT', fiat, type, cacheKey);
    }

    return prices;
  }

  async ensureSOLUSDPrice() {
    const cacheKey = 'prices/solana/usd';
    let price = cache.get(cacheKey);
    
    if (!price) {
      try {
        const response = await axios.get(`${this.SPOT_URL}?symbol=SOLUSDT`);
        price = parseFloat(response.data.price);
        if (!isNaN(price)) {
          cache.set(cacheKey, price, this.CACHE_TTL);
        }
      } catch (error) {
        console.error('Error fetching SOL/USD spot price:', error);
        return null;
      }
    }

    return price;
  }

  async fetchPrices(token, fiat, type) {
    try {
      const cacheKey = `prices/${token.toUpperCase()}/${fiat.toUpperCase()}/${type.toUpperCase()}`;
      const cachedValue = cache.get(cacheKey);
      
      if (cachedValue && (Array.isArray(cachedValue) || typeof cachedValue === 'number')) {
        const cacheAge = (Date.now() - cache.getTtl(cacheKey)) / 1000;
        if (cacheAge < this.CACHE_TTL) {
          return cachedValue;
        }
      }

      // Try to fetch new prices
      const newPrices = await this._fetchFreshPrices(token, fiat, type, cacheKey);
      if (newPrices) {
        return newPrices;
      }

      // If fetch failed but we have old cached values, use them anyway
      if (cachedValue) {
        console.log(`Using stale cache for ${token}/${fiat} ${type} as fallback`);
        return cachedValue;
      }

      return null;
    } catch (error) {
      console.error(`Error in fetchPrices for ${token}/${fiat} ${type}:`, error);
      return null;
    }
  }

  async _fetchFreshPrices(token, fiat, type, cacheKey) {
    try {
      // Special handling for SOL regardless of allow_binance_rates flag
      if (token.toUpperCase() === 'SOL') {
        return this.fetchSOLPrices(fiat, type);
      }

      const results = [];
      
      // Fetch first page
      let firstPage;
      try {
        firstPage = await this.searchBinanceWithRetry(token, fiat, type, 1);
      } catch (error) {
        this.logPriceFailure({
          token,
          fiat,
          type,
          reason: 'Failed to fetch first page from Binance P2P',
          details: {
            error: error.message,
            retries: this.MAX_RETRIES,
            endpoint: this.BASE_URL
          }
        });
        return null;
      }

      if (!firstPage?.data) {
        this.logPriceFailure({
          token,
          fiat,
          type,
          reason: 'No orders found on Binance P2P',
          details: {
            responseData: firstPage,
            searchParams: { token, fiat, type }
          }
        });
        return null;
      }
      
      results.push(...firstPage.data.map(ad => parseFloat(ad.adv.price)));
      const totalPages = Math.min(
        Math.ceil(firstPage.total / this.PER_PAGE),
        Math.ceil(this.MAX_PRICE_POINTS / this.PER_PAGE)
      );

      // Log initial results info
      console.log(`Found ${firstPage.total} total orders, fetching up to ${totalPages} pages`);
      
      // Fetch remaining pages until MAX_PRICE_POINTS
      for (let page = 2; page <= totalPages; page++) {
        if (results.length >= this.MAX_PRICE_POINTS) break;
        
        try {
          const pageResult = await this.searchBinanceWithRetry(token, fiat, type, page);
          if (pageResult?.data) {
            results.push(...pageResult.data
              .map(ad => parseFloat(ad.adv.price))
              .slice(0, this.MAX_PRICE_POINTS - results.length)
            );
          }
        } catch (error) {
          console.warn(`Failed to fetch page ${page}, continuing with existing results`);
        }
      }

      // Reduce minimum price points requirement for less liquid pairs
      const minPoints = ['VES', 'COP', 'PEN', 'KES', 'MAD', 'EGP'].includes(fiat.toUpperCase()) ? 3 : this.MIN_PRICE_POINTS;
      
      if (results.length < minPoints) {
        this.logPriceFailure({
          token,
          fiat,
          type,
          reason: 'Insufficient price points',
          details: {
            found: results.length,
            required: minPoints,
            prices: results,
            totalListings: firstPage.total,
            pagesChecked: totalPages
          }
        });
        return null;
      }

      const sorted = results.sort((a, b) => a - b);
      const median = sorted.length % 2 === 1
        ? sorted[Math.floor(sorted.length / 2)]
        : (sorted[sorted.length / 2] + sorted[sorted.length / 2 - 1]) / 2;

      // Validate the price spread
      const spread = ((sorted[sorted.length - 1] - sorted[0]) / sorted[0]) * 100;
      if (spread > 200) { // Warning threshold for extreme spreads
        console.warn(`High price spread of ${spread.toFixed(1)}% for ${token}/${fiat} ${type}`);
      }

      const finalResults = [sorted[0], median, sorted[sorted.length - 1]];
      
      // Validate final results before caching
      if (!this.validatePriceSet(finalResults, token, fiat)) {
        this.logPriceFailure({
          token,
          fiat,
          type,
          reason: 'Price validation failed',
          details: {
            prices: finalResults,
            spread: spread.toFixed(1) + '%',
            sampleSize: results.length
          }
        });
        return null;
      }

      const cacheSuccess = cache.set(cacheKey, finalResults, this.CACHE_TTL);
      if (!cacheSuccess) {
        this.logPriceFailure({
          token,
          fiat,
          type,
          reason: 'Cache write failed',
          details: { cacheKey, finalResults }
        });
      } else {
        console.log(`Successfully cached ${results.length} prices for ${token}/${fiat} ${type}`);
      }
      
      return finalResults;
    } catch (error) {
      this.logPriceFailure({
        token,
        fiat,
        type,
        reason: 'Unexpected error in price fetching',
        error: error.message,
        stack: error.stack,
        details: {
          endpoint: this.BASE_URL,
          parameters: { token, fiat, type }
        }
      });
      return null;
    }
  }

  async fetchAllPrices(tokens, fiats) {
    const results = [];
    
    for (const token of tokens) {
      for (const fiat of fiats) {
        try {
          const [buyPrices, sellPrices] = await Promise.all([
            this.fetchPrices(token.symbol, fiat.code, 'BUY'),
            this.fetchPrices(token.symbol, fiat.code, 'SELL')
          ]);
          
          results.push({ 
            token: token.symbol, 
            fiat: fiat.code, 
            success: !!(buyPrices && sellPrices),
            buyPrices,
            sellPrices
          });
        } catch (error) {
          results.push({ 
            token: token.symbol, 
            fiat: fiat.code, 
            success: false, 
            error: error.message 
          });
        }
        await this.sleep(this.RETRY_DELAY);
      }
    }
    
    return results;
  }

  validatePriceSet(prices, token, fiat) {
    if (!Array.isArray(prices) || prices.length !== 3) {
      return false;
    }

    // Check for valid numbers
    if (!prices.every(p => typeof p === 'number' && !isNaN(p) && p > 0)) {
      return false;
    }

    // Check price variance (max 15% spread between min and max)
    const [min, med, max] = prices;
    const spread = ((max - min) / min) * 100;
    if (spread > 15) {
      console.warn(`High price spread (${spread.toFixed(2)}%) for ${token}/${fiat}`);
      return false;
    }

    // Verify median is between min and max
    if (med < min || med > max) {
      return false;
    }

    return true;
  }

  cleanupSolanaCache() {
    try {
      const keys = cache.keys();
      const solanaKeys = keys.filter(key => key.startsWith('_solanaCalculations/SOL/'));
      
      for (const key of solanaKeys) {
        const value = cache.get(key);
        if (value && typeof value === 'object') {
          // Convert nested value structure to direct number
          const directValue = value.value?.value || value.value;
          if (typeof directValue === 'number' && !isNaN(directValue)) {
            cache.set(key, directValue, this.CACHE_TTL);
            console.log(`Cleaned up cache entry for ${key}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up Solana cache:', error);
    }
  }

  logPriceFailure(details) {
    const failureEntry = {
      timestamp: new Date().toISOString(),
      ...details,
      cache_state: this.getCacheState(details)
    };

    // Add to in-memory log
    this.priceFailureLog.unshift(failureEntry);
    if (this.priceFailureLog.length > this.MAX_FAILURE_LOG_SIZE) {
      this.priceFailureLog.pop();
    }

    // Log to file system
    this.persistFailureLog(failureEntry);
    
    console.error('Price Failure:', failureEntry);
  }

  getCacheState(details) {
    const cacheState = {};
    
    // Check relevant cache keys
    if (details.token === 'SOL') {
      const solUsdKey = 'prices/solana/usd';
      cacheState.solUsdPrice = {
        exists: cache.has(solUsdKey),
        value: cache.get(solUsdKey)
      };
    }

    // Check USDT price cache
    const usdtKey = `prices/USDT/${details.fiat}/${details.type}`;
    cacheState.usdtPrices = {
      exists: cache.has(usdtKey),
      value: cache.get(usdtKey)
    };

    // Check final calculation cache
    const calcKey = `_solanaCalculations/SOL/${details.fiat}/${details.type}`;
    cacheState.calculation = {
      exists: cache.has(calcKey),
      value: cache.get(calcKey)
    };

    return cacheState;
  }

  async persistFailureLog(entry) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const logDir = path.join(__dirname, '../logs/price_failures');
      
      // Ensure log directory exists
      await fs.mkdir(logDir, { recursive: true });
      
      // Create daily log file
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `price_failures_${date}.jsonl`);
      
      // Append to log file
      await fs.appendFile(
        logFile, 
        JSON.stringify(entry) + '\n',
        'utf8'
      );
    } catch (error) {
      console.error('Failed to persist price failure log:', error);
    }
  }
}

class CacheMonitor {
  constructor() {
    this.failureCount = new Map();
    this.lastSuccess = new Map();
  }

  recordSuccess(cacheKey) {
    this.failureCount.delete(cacheKey);
    this.lastSuccess.set(cacheKey, Date.now());
  }

  recordFailure(cacheKey) {
    const count = (this.failureCount.get(cacheKey) || 0) + 1;
    this.failureCount.set(cacheKey, count);
    
    if (count >= 3) {
      console.error(`Critical: Multiple failures for ${cacheKey}`);
      // Implement alerting system here
    }
  }
}

module.exports = new BinancePriceService();