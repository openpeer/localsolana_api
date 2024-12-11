// controllers/lists/shared/price-calculation.js
const { cache } = require('../../../utils/cache');
const { isCoinGeckoSupported } = require('../../../utils/supportedCurrencies');

const getPriceFromBinance = (token, fiatCurrency, listType) => {
  const type = listType === 'SellList' ? 'BUY' : 'SELL';
  const cacheKey = `prices/${token.symbol.toUpperCase()}/${fiatCurrency.code.toUpperCase()}/${type}`;
  const prices = cache.get(cacheKey);

  // Add more detailed logging
  console.log('Cache state for key:', cacheKey, {
    rawValue: prices,
    cacheExists: cache.has(cacheKey),
    timestamp: Date.now()
  });

  // Validate cache data more strictly
  if (!prices || (Array.isArray(prices) && prices.length === 0)) {
    console.error(`Invalid or empty cache for key: ${cacheKey}`);
    return null;
  }

  // Handle array vs single price cases
  if (Array.isArray(prices)) {
    return prices[Math.floor(prices.length / 2)];
  }

  if (typeof prices === 'number' && !isNaN(prices)) {
    return prices;
  }

  console.error(`Unexpected price format for key ${cacheKey}:`, prices);
  return null;
};

const getPriceFromCoingecko = (token, fiatCurrency) => {
  const cacheKey = `prices/${token.coingecko_id.toLowerCase()}/${fiatCurrency.code.toLowerCase()}`;
  const price = cache.get(cacheKey);

  if (!price) {
    console.log(`Checking CoinGecko cache for ${cacheKey}`);
    return null;
  }
  return price;
};

const applyMarginToPrice = (spotPrice, margin) => {
  return spotPrice * parseFloat(margin);
};

exports.calculateListingPrice = async function(listData, fiatCurrency, token) {
  console.log('Calculating price for:', {
    listData,
    fiatCurrency: fiatCurrency?.dataValues,
    token: token?.dataValues
  });
  
  if (!fiatCurrency || !token) {
    console.error('Missing required data for price calculation:', { fiatCurrency, token });
    return parseFloat(listData.price);
  }

  // For fixed rate, return the stored price immediately
  if (listData.margin_type === 0) {
    return parseFloat(listData.price);
  }

  // Determine which price source to use
  const useBinance = listData.price_source === 1 && 
    fiatCurrency.dataValues.allow_binance_rates === true &&
    token.dataValues.allow_binance_rates === true;

  const useCoingecko = listData.price_source === 0 && 
    token.dataValues.coingecko_id && 
    isCoinGeckoSupported(fiatCurrency.dataValues.code);

  // Get spot price based on source
  let spotPrice = null;

  if (useBinance) {
    spotPrice = getPriceFromBinance(token.dataValues, fiatCurrency.dataValues, listData.type);
  } else if (useCoingecko) {
    spotPrice = getPriceFromCoingecko(token.dataValues, fiatCurrency.dataValues);
  }

  if (!spotPrice) {
    console.error(`No price available for ${fiatCurrency.dataValues.code} from source ${listData.price_source}`);
    return null;
  }

  // For floating rate, apply margin to spot price
  const margin = parseFloat(listData.margin);
  return applyMarginToPrice(spotPrice, margin);
};

// Additional utility functions for price-related operations
exports.validatePriceRange = (price, minPrice, maxPrice) => {
  if (!price || !minPrice || !maxPrice) return true;
  return price >= minPrice && price <= maxPrice;
};

exports.formatPrice = (price, decimals = 2) => {
  if (!price) return null;
  return parseFloat(price.toFixed(decimals));
};

exports.calculatePriceImpact = (currentPrice, previousPrice) => {
  if (!currentPrice || !previousPrice) return null;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
};

exports.PRICE_SOURCES = {
  FIXED: 0,
  BINANCE: 1,
  COINGECKO: 2
};