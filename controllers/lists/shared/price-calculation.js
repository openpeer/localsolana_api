// controllers/lists/shared/price-calculation.js
const { cache } = require('../../../utils/cache');
const { isCoinGeckoSupported } = require('../../../utils/supportedCurrencies');

const getPriceFromBinance = (token, fiatCurrency, listType) => {
  const type = listType === 'SellList' ? 'BUY' : 'SELL';
  const cacheKey = `prices/${token.symbol.toUpperCase()}/${fiatCurrency.code.toUpperCase()}/${type}`;
  const prices = cache.get(cacheKey);

  if (prices && Array.isArray(prices)) {
    return prices[1]; // Use median price
  }
  console.error(`Cache miss for Binance prices: ${cacheKey}`);
  return null;
};

const getPriceFromCoingecko = (token, fiatCurrency) => {
  const cacheKey = `prices/${token.coingecko_id.toLowerCase()}/${fiatCurrency.code.toLowerCase()}`;
  const price = cache.get(cacheKey);

  if (!price) {
    console.log(`Using fixed price for ${fiatCurrency.code} as CoinGecko price not available`);
    return null;
  }
  return price;
};

const applyMarginToPrice = (spotPrice, margin) => {
  return spotPrice + ((spotPrice * margin) / 100);
};

exports.calculateListingPrice = async (list, fiatCurrency, token) => {
  if (!fiatCurrency || !token) {
    console.error('Missing required data for price calculation:', { fiatCurrency, token });
    return parseFloat(list.price);
  }

  // Determine which price source to use
  const canUseBinance = list.price_source === 1 && 
    fiatCurrency.dataValues.allow_binance_rates === true;

  const useCoingecko = list.price_source === 2 && 
    token.dataValues.coingecko_id && 
    isCoinGeckoSupported(fiatCurrency.dataValues.code);

  // Get spot price based on source
  let spotPrice = null;

  if (canUseBinance) {
    spotPrice = getPriceFromBinance(token.dataValues, fiatCurrency.dataValues, list.type);
  } else if (useCoingecko) {
    spotPrice = getPriceFromCoingecko(token.dataValues, fiatCurrency.dataValues);
  }

  if (!spotPrice) {
    console.log(`Using fixed price for ${fiatCurrency.dataValues.code} as no dynamic price available`);
    if (list.margin_type === 1) {
      // For floating rate, apply margin to the fixed price
      const margin = parseFloat(list.margin);
      return applyMarginToPrice(parseFloat(list.price), margin);
    }
    return parseFloat(list.price);
  }

  // Apply margin if using floating rate
  if (spotPrice > 0 && list.margin_type === 1) {
    const margin = parseFloat(list.margin);
    return applyMarginToPrice(spotPrice, margin);
  }

  return parseFloat(list.price);
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