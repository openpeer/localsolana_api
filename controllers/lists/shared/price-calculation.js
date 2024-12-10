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

  // Determine which price source to use
  const canUseBinance = listData.price_source === 1 && 
    fiatCurrency.dataValues.allow_binance_rates === true;

  const useCoingecko = listData.price_source === 2 && 
    token.dataValues.coingecko_id && 
    isCoinGeckoSupported(fiatCurrency.dataValues.code);

  // Get spot price based on source
  let spotPrice = null;

  if (canUseBinance) {
    spotPrice = getPriceFromBinance(token.dataValues, fiatCurrency.dataValues, listData.type);
  } else if (useCoingecko) {
    spotPrice = getPriceFromCoingecko(token.dataValues, fiatCurrency.dataValues);
  }

  if (!spotPrice) {
    console.error(`No price available for ${fiatCurrency.dataValues.code} from source ${listData.price_source}`);
    return null;
  }

  // Apply margin if using floating rate
  if (spotPrice > 0 && listData.margin_type === 1) {
    const margin = parseFloat(listData.margin);
    spotPrice = applyMarginToPrice(spotPrice, margin);
  }

  const result = parseFloat(listData.price);

  console.log('Calculated price result:', result);
  return result;
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