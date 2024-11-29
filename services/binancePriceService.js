// services/binancePriceService.js

const axios = require('axios');
const {cache} = require('../utils/cache');

class BinancePriceService {
  constructor() {
    this.PER_PAGE = 20;
    this.BASE_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
    this.SPOT_URL = 'https://api.binance.com/api/v3/ticker/price';
    this.MIN_PRICE_POINTS = 3;
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY = 1000; // 1 second
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async searchBinanceWithRetry(token, fiat, type, page) {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const { data } = await axios.post(this.BASE_URL, {
          page,
          rows: this.PER_PAGE,
          publisherType: null,
          asset: token,
          tradeType: type,
          fiat,
          payTypes: []
        });

        if (!data.success) {
          console.warn(`Binance API returned unsuccessful response for ${token}/${fiat}:`, data);
          continue;
        }

        if (!data.data || data.data.length === 0) {
          console.warn(`No ${type} orders found for ${token}/${fiat} on page ${page}`);
          return null;
        }

        return data;
      } catch (error) {
        console.error(`Binance API error (attempt ${attempt}/${this.MAX_RETRIES}):`, error.message);
        if (attempt < this.MAX_RETRIES) {
          await this.sleep(this.RETRY_DELAY);
          continue;
        }
        return null;
      }
    }
    return null;
  }

  async fetchPrices(token, fiat, type) {
    try {
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
      const totalPages = Math.ceil(firstPage.total / this.PER_PAGE);
      
      // Fetch remaining pages
      for (let page = 2; page <= totalPages; page++) {
        const pageResult = await this.searchBinanceWithRetry(token, fiat, type, page);
        if (pageResult?.data) {
          results.push(...pageResult.data.map(ad => parseFloat(ad.adv.price)));
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

      const cacheKey = `prices/${token.toUpperCase()}/${fiat.toUpperCase()}/${type.toUpperCase()}`;
      cache.set(cacheKey, [sorted[0], median, sorted[sorted.length - 1]], 3600);
      
      console.log(`Successfully cached ${results.length} prices for ${token}/${fiat} ${type}`);
    } catch (error) {
      console.error(`Error fetching prices for ${token}/${fiat} ${type}:`, error.message);
    }
  }

  async fetchSOLPrices(fiat, type) {
    try {
      // 1. Get USDT/Fiat price with validation
      const usdtResults = [];
      const firstPage = await this.searchBinanceWithRetry('USDT', fiat, type, 1);
      if (!firstPage?.data) {
        console.error(`No USDT/${fiat} ${type} orders found on Binance P2P`);
        return;
      }
      
      usdtResults.push(...firstPage.data.map(ad => parseFloat(ad.adv.price)));
      const totalPages = Math.ceil(firstPage.total / this.PER_PAGE);
      
      // Fetch remaining pages for USDT
      for (let page = 2; page <= totalPages; page++) {
        const pageResult = await this.searchBinanceWithRetry('USDT', fiat, type, page);
        if (pageResult?.data) {
          usdtResults.push(...pageResult.data.map(ad => parseFloat(ad.adv.price)));
        }
      }

      if (usdtResults.length < this.MIN_PRICE_POINTS) {
        console.error(`Insufficient USDT/${fiat} price points. Found: ${usdtResults.length}, Required: ${this.MIN_PRICE_POINTS}`);
        return;
      }
      
      // 2. Get SOL/USDT price from Binance spot with retry
      let spotPrice = null;
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        spotPrice = await this.getSOLUSDTPrice();
        if (spotPrice) break;
        if (attempt < this.MAX_RETRIES) await this.sleep(this.RETRY_DELAY);
      }

      if (!spotPrice) {
        console.error('Failed to fetch SOL/USDT spot price after all retries');
        return;
      }

      // 3. Calculate SOL/Fiat prices
      const results = usdtResults.map(price => price * spotPrice);
      const sorted = results.sort((a, b) => a - b);
      
      const median = sorted.length % 2 === 1
        ? sorted[Math.floor(sorted.length / 2)]
        : (sorted[sorted.length / 2] + sorted[sorted.length / 2 - 1]) / 2;

      const cacheKey = `prices/SOL/${fiat.toUpperCase()}/${type.toUpperCase()}`;
      cache.set(cacheKey, [sorted[0], median, sorted[sorted.length - 1]], 3600);
      
      console.log(`Successfully cached ${results.length} SOL prices for ${fiat} ${type} (via USDT)`);
    } catch (error) {
      console.error(`Error calculating SOL prices for ${fiat} ${type}:`, error.message);
    }
  }

  async getSOLUSDTPrice() {
    try {
      const { data } = await axios.get(`${this.SPOT_URL}?symbol=SOLUSDT`);
      const price = parseFloat(data.price);
      if (isNaN(price)) {
        console.error('Invalid SOL/USDT price received from Binance:', data);
        return null;
      }
      return price;
    } catch (error) {
      console.error('Error fetching SOL/USDT price:', error.message);
      return null;
    }
  }
}

module.exports = new BinancePriceService();