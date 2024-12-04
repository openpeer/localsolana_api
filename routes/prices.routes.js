const { cache } = require('../utils/cache');

const pricesController = {
  inspectCache: (req, res) => {
    try {
      const cacheKeys = cache.keys();
      const status = {};
      
      cacheKeys.forEach(key => {
        if (key.startsWith('prices/')) {
          const value = cache.get(key);
          const ttl = cache.getTtl(key);
          const age = Math.round((Date.now() - ttl) / 1000);
          
          status[key] = {
            value,
            age,
            expires: new Date(ttl).toISOString(),
            isExpired: age >= 1800
          };
        }
      });
      
      res.json({
        totalCacheEntries: cacheKeys.length,
        priceEntries: Object.keys(status).length,
        prices: status
      });
    } catch (error) {
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
    }
  },

  getPairPrice: (req, res) => {
    const { token, fiat } = req.params;
    try {
      const buyKey = `prices/${token.toUpperCase()}/${fiat.toUpperCase()}/BUY`;
      const sellKey = `prices/${token.toUpperCase()}/${fiat.toUpperCase()}/SELL`;
      
      res.json({
        buy: {
          prices: cache.get(buyKey),
          ttl: cache.getTtl(buyKey),
          age: Math.round((Date.now() - cache.getTtl(buyKey)) / 1000)
        },
        sell: {
          prices: cache.get(sellKey),
          ttl: cache.getTtl(sellKey),
          age: Math.round((Date.now() - cache.getTtl(sellKey)) / 1000)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = pricesController;