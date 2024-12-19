// controllers/lists/shared/price-calculation.js
const { cache } = require('../../../utils/cache');
const { isCoinGeckoSupported } = require('../../../utils/supportedCurrencies');
const binancePriceService = require('../../../services/binancePriceService');

const getPriceFromBinance = async (token, fiatCurrency, listType, returnFullArray = false) => {
  try {
    // Check if Binance rates are allowed for this currency
    if (!fiatCurrency.allow_binance_rates) {
      console.log(`Binance rates not allowed for ${fiatCurrency.code}, falling back to CoinGecko`);
      return getPriceFromCoingecko(token, fiatCurrency);
    }

    const type = listType === 'SellList' ? 'BUY' : 'SELL';
    
    // For SOL, check the special calculations first
    if (token.symbol.toUpperCase() === 'SOL') {
      const solCacheKey = `_solanaCalculations/SOL/${fiatCurrency.code.toUpperCase()}/${type}`;
      const solPrice = cache.get(solCacheKey);
      
      console.log(`Checking SOL calculation cache for ${solCacheKey}:`, solPrice);
      
      if (!solPrice) {
        console.log('Cache miss, fetching fresh SOL price...');
        const freshPrice = await binancePriceService.fetchSOLPrices(fiatCurrency.code, type);
        if (freshPrice) {
          return freshPrice;
        }
        binancePriceService.logPriceFailure({
          token: 'SOL',
          fiat: fiatCurrency.code,
          type,
          reason: 'Missing SOL calculation cache',
          cacheKey: solCacheKey
        });
      }
      
      // Simplified price check
      if (typeof solPrice === 'number' && !isNaN(solPrice)) {
        return solPrice;
      }
    }

    // Fallback to standard Binance price lookup
    const cacheKey = `prices/${token.symbol.toUpperCase()}/${fiatCurrency.code.toUpperCase()}/${type}`;
    const prices = cache.get(cacheKey);

    console.log(`Checking standard cache for ${cacheKey}:`, prices);

    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      console.error(`No valid prices found for ${cacheKey}`);
      return null;
    }

    // Return full array if requested (for min/max calculations)
    if (returnFullArray) {
      return prices;
    }

    // Otherwise return median price (index 1 for array of 3)
    return prices[1];
  } catch (error) {
    binancePriceService.logPriceFailure({
      token: token.symbol,
      fiat: fiatCurrency.code,
      type,
      reason: 'Error in getPriceFromBinance',
      error: error.message,
      stack: error.stack
    });
    return null;
  }
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

// Add currency-specific decimal places
const getDecimalPlaces = (fiatCode) => {
  switch(fiatCode.toUpperCase()) {
    case 'VES':
    case 'COP':
    case 'KES':
      return 2;
    case 'EUR':
    case 'USD':
      return 4;
    default:
      return 4;
  }
};

exports.calculateListingPrice = async function(listData, fiatCurrency, token) {
  try {
    console.log('Calculating price for:', { listData, fiatCurrency, token });

    if (!fiatCurrency || !token) {
      console.error('Missing required data:', { fiatCurrency, token });
      return null;
    }

    let basePrice;
    const priceSource = listData.price_source;

    // Handle fixed rate
    if (listData.margin_type === 0) {
      return Number(listData.price);
    }

    // Get base price according to source
    switch (priceSource) {
      case 0: // CoinGecko
        basePrice = getPriceFromCoingecko(token, fiatCurrency);
        break;
      case 1: // Binance median
        basePrice = await getPriceFromBinance(token, fiatCurrency, listData.type);
        break;
      case 2: // Binance min
        const prices = await getPriceFromBinance(token, fiatCurrency, listData.type, true);
        if (Array.isArray(prices) && prices.length > 0) {
          basePrice = prices[0]; // Use minimum price
          console.log(`Using minimum price from array:`, prices, basePrice);
        }
        break;
      case 3: // Binance max
        const maxPrices = await getPriceFromBinance(token, fiatCurrency, listData.type, true);
        if (Array.isArray(maxPrices) && maxPrices.length > 0) {
          basePrice = maxPrices[maxPrices.length - 1]; // Use maximum price
          console.log(`Using maximum price from array:`, maxPrices, basePrice);
        }
        break;
      default:
        console.error(`Unsupported price source: ${priceSource}`);
        binancePriceService.logPriceFailure({
          token: token.symbol,
          fiat: fiatCurrency.code,
          type: listData.type,
          reason: `Unsupported price source: ${priceSource}`,
          details: { priceSource }
        });
        return null;
    }

    if (!basePrice) {
      console.error(`No price available for ${fiatCurrency.code} from source ${priceSource}`);
      binancePriceService.logPriceFailure({
        token: token.symbol,
        fiat: fiatCurrency.code,
        type: listData.type,
        reason: 'No price available',
        details: { priceSource }
      });
      return null;
    }

    // Apply margin
    const margin = Number(listData.margin);
    const finalPrice = Number((basePrice * margin).toFixed(getDecimalPlaces(fiatCurrency.code)));

    console.log('Price calculation result:', {
      basePrice,
      margin,
      finalPrice,
      source: priceSource
    });

    return finalPrice;
  } catch (error) {
    console.error('Error calculating price:', error);
    binancePriceService.logPriceFailure({
      token: token.symbol,
      fiat: fiatCurrency.code,
      type: listData.type,
      reason: 'Error in calculateListingPrice',
      error: error.message,
      stack: error.stack
    });
    return null;
  }
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