// services/binancePriceService.js

const axios = require('axios');
const {cache} = require('../utils/cache');

class BinancePriceService {
  constructor() {
    this.PER_PAGE = 20;
    this.BASE_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
  }

  async searchBinance(token, fiat, type, page) {
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
      return data.success ? data : null;
    } catch (error) {
      console.error('Binance API error:', error);
      return null;
    }
  }

  async fetchPrices(token, fiat, type) {
    const results = [];
    
    // Fetch first page
    const firstPage = await this.searchBinance(token, fiat, type, 1);
    if (!firstPage?.data) return;
    
    results.push(...firstPage.data.map(ad => parseFloat(ad.adv.price)));
    const totalPages = Math.ceil(firstPage.total / this.PER_PAGE);
    
    // Fetch remaining pages
    for (let page = 2; page <= totalPages; page++) {
      const pageResult = await this.searchBinance(token, fiat, type, page);
      if (pageResult?.data) {
        results.push(...pageResult.data.map(ad => parseFloat(ad.adv.price)));
      }
    }

    const sorted = results.sort((a, b) => a - b);
    if (sorted.length < 3) return;

    const median = sorted.length % 2 === 1
      ? sorted[Math.floor(sorted.length / 2)]
      : (sorted[sorted.length / 2] + sorted[sorted.length / 2 - 1]) / 2;

    const cacheKey = `prices/${token.toUpperCase()}/${fiat.toUpperCase()}/${type.toUpperCase()}`;
    cache.set(cacheKey, [sorted[0], median, sorted[sorted.length - 1]], 3600);
  }
}

module.exports = new BinancePriceService();