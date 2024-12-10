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
      // Get USDT prices with validation
      const usdtResults = await this.fetchPrices('USDT', fiat, type);
      if (!Array.isArray(usdtResults) || usdtResults.length !== 3) {
        console.error(`Invalid USDT/${fiat} prices:`, usdtResults);
        return null;
      }

      // Get SOL/USDT price with retries
      let solUsdtPrice = null;
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          const spotResponse = await axios.get(`${this.SPOT_URL}?symbol=SOLUSDT`);
          if (spotResponse?.data?.price) {
            solUsdtPrice = parseFloat(spotResponse.data.price);
            break;
          }
        } catch (error) {
          console.error(`SOL/USDT spot price fetch attempt ${attempt} failed:`, error.message);
          if (attempt < this.MAX_RETRIES) {
            await this.sleep(this.RETRY_DELAY);
          }
        }
      }

      if (!solUsdtPrice) {
        console.error('Failed to fetch SOL/USDT price after all retries');
        return null;
      }

      // Calculate with precision handling
      const results = usdtResults.map(price => {
        const calculated = price * solUsdtPrice;
        return Number(calculated.toFixed(4)); // Prevent floating point issues
      });

      const cacheKey = `prices/SOL/${fiat}/${type}`;
      cache.set(cacheKey, results, this.CACHE_TTL);
      
      console.log(`Cached SOL/${fiat} ${type} prices:`, {
        usdtPrices: usdtResults,
        solUsdtPrice,
        finalPrices: results
      });
      
      return results;
    } catch (error) {
      console.error('Error in fetchSOLPrices:', error);
      return null;
    }
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
      const firstPage = await this.searchBinanceWithRetry(token, fiat, type, 1);
      if (!firstPage?.data) {
        console.error(`No initial data found for ${token}/${fiat} ${type}`);
        return null;
      }
      
      results.push(...firstPage.data.map(ad => parseFloat(ad.adv.price)));
      const totalPages = Math.min(
        Math.ceil(firstPage.total / this.PER_PAGE),
        Math.ceil(this.MAX_PRICE_POINTS / this.PER_PAGE)
      );
      
      // Fetch remaining pages until MAX_PRICE_POINTS
      for (let page = 2; page <= totalPages; page++) {
        if (results.length >= this.MAX_PRICE_POINTS) break;
        
        const pageResult = await this.searchBinanceWithRetry(token, fiat, type, page);
        if (pageResult?.data) {
          results.push(...pageResult.data
            .map(ad => parseFloat(ad.adv.price))
            .slice(0, this.MAX_PRICE_POINTS - results.length)
          );
        }
      }

      // Reduce minimum price points requirement for less liquid pairs
      const minPoints = ['VES', 'COP', 'PEN', 'KES', 'MAD', 'EGP'].includes(fiat.toUpperCase()) ? 3 : this.MIN_PRICE_POINTS;
      
      if (results.length < minPoints) {
        console.error(`Insufficient price points for ${token}/${fiat} ${type}. Found: ${results.length}, Required: ${minPoints}`);
        return null;
      }

      const sorted = results.sort((a, b) => a - b);
      const median = sorted.length % 2 === 1
        ? sorted[Math.floor(sorted.length / 2)]
        : (sorted[sorted.length / 2] + sorted[sorted.length / 2 - 1]) / 2;

      const finalResults = [sorted[0], median, sorted[sorted.length - 1]];
      cache.set(cacheKey, finalResults, this.CACHE_TTL);
      
      console.log(`Successfully cached ${results.length} prices for ${token}/${fiat} ${type}`);
      return finalResults;
    } catch (error) {
      console.error(`Error in _fetchFreshPrices for ${token}/${fiat} ${type}:`, error);
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