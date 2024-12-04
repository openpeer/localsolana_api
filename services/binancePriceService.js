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
      // First get USDT price for the fiat
      const usdtResults = await this.fetchPrices('USDT', fiat, type);
      if (!usdtResults) return null;

      // Then get SOL/USDT spot price
      const spotResponse = await axios.get(`${this.SPOT_URL}?symbol=SOLUSDT`);
      const solUsdtPrice = parseFloat(spotResponse.data.price);

      // Calculate SOL prices in fiat
      const [min, median, max] = usdtResults;
      const results = [
        min * solUsdtPrice,
        median * solUsdtPrice,
        max * solUsdtPrice
      ];

      const cacheKey = `prices/SOL/${fiat}/${type}`;
      cache.set(cacheKey, results, this.CACHE_TTL);
      return results;
    } catch (error) {
      console.error('Error fetching SOL prices:', error);
      return null;
    }
  }

  async fetchPrices(token, fiat, type) {
    try {
      // Check cache first with age verification
      const cacheKey = `prices/${token.toUpperCase()}/${fiat.toUpperCase()}/${type.toUpperCase()}`;
      const cachedValue = cache.get(cacheKey);
      
      if (cachedValue) {
        const cacheAge = (Date.now() - cache.getTtl(cacheKey)) / 1000;
        if (cacheAge < this.CACHE_TTL) {
          console.log(`Using cached prices for ${token}/${fiat} ${type} (age: ${Math.round(cacheAge)}s)`);
          return cachedValue;
        } else {
          console.log(`Cache expired for ${token}/${fiat} ${type} (age: ${Math.round(cacheAge)}s)`);
        }
      }

      // Special handling for SOL
      if (token.toUpperCase() === 'SOL') {
        return this.fetchSOLPrices(fiat, type);
      }

      const results = [];
      
      // Fetch first page
      const firstPage = await this.searchBinanceWithRetry(token, fiat, type, 1);
      if (!firstPage?.data) {
        console.error(`No initial data found for ${token}/${fiat} ${type}`);
        return;
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

      if (results.length < this.MIN_PRICE_POINTS) {
        console.error(`Insufficient price points for ${token}/${fiat} ${type}. Found: ${results.length}, Required: ${this.MIN_PRICE_POINTS}`);
        return;
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
      console.error(`Error fetching ${token}/${fiat} ${type} prices:`, error);
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
}

module.exports = new BinancePriceService();