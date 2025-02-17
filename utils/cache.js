const NodeCache = require('node-cache');

const cache = new NodeCache({
 stdTTL: 3600 ,
  checkperiod: 120  // Period in seconds to check for expired cache entries
});

  /**
   * Fetches cached token prices.
   * @param {string} id - The coin ID (e.g., 'bitcoin').
   * @param {string} currency - The currency (e.g., 'usd').
   * @returns {number|null} - The cached price or null if not found.
   */
 const getCachedPrice = function(id, currency) {
    const cacheKey = `prices/${id.toLowerCase()}/${currency.toLowerCase()}`;
    const price = cache.get(cacheKey);
    console.log(`Getting cached price for ${cacheKey}:`, price);
    return price || null;
  };
module.exports = {cache,getCachedPrice};
