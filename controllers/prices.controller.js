// Required dependencies
require("dotenv").config();
const { cache } = require('../utils/cache');
const AutomaticPriceFetchCron = require("../crons/automatic_price_fetch_cron");
const binancePriceService = require('../services/binancePriceService');
const { errorResponse, successResponse } = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
const { isCoinGeckoSupported, isBinanceSupported } = require('../utils/supportedCurrencies');

exports.fetchData = async (req, res) => {
    try {
        const {token, fiat, source = 'coingecko', type = 'BUY'} = req.query; 

        // Validate required parameters
        if (!token || !fiat) {
            return errorResponse(res, httpCodes.badReq, "Token and fiat parameters are required");
        }

        // Check currency support for both CoinGecko and Binance
        const useCoingecko = isCoinGeckoSupported(fiat);
        const useBinance = isBinanceSupported(fiat);

        // Return error if currency isn't supported by either service
        if (!useCoingecko && !useBinance) {
            return errorResponse(
                res, 
                httpCodes.badReq, 
                `Currency ${fiat} is not supported by either CoinGecko or Binance`
            );
        }

        // Use CoinGecko if supported and not explicitly requesting Binance
        if (useCoingecko && !source.startsWith('binance_')) {
            // CoinGecko prices don't have BUY/SELL distinction
            const cacheKey = `prices/${token.toUpperCase()}/${fiat.toUpperCase()}`;
            let cachedPrice = cache.get(cacheKey);
            
            if (cachedPrice != null) {
                return successResponse(res, Messages.success, { 
                    [token]: { [fiat]: cachedPrice }
                });
            }

            // If not in cache, fetch new price from CoinGecko
            const priceCron = new AutomaticPriceFetchCron();
            await priceCron.fetchSingleTokenPrice(token, fiat);
            
            // Check cache again
            cachedPrice = cache.get(cacheKey);
            if (cachedPrice != null) {
                return successResponse(res, Messages.success, { 
                    [token]: { [fiat]: cachedPrice }
                });
            }
        }

        // Use Binance if supported and either explicitly requested or CoinGecko isn't available
        if (useBinance && (source.startsWith('binance_') || !useCoingecko)) {
            // Validate source parameter format
            const parts = source.split('_');
            if (parts.length !== 2 || !['MIN', 'MEDIAN', 'MAX'].includes(parts[1].toUpperCase())) {
                return errorResponse(
                    res, 
                    httpCodes.badReq, 
                    "Invalid Binance price source format. Use: binance_[MIN|MEDIAN|MAX]"
                );
            }

            // Validate trade type
            if (!['BUY', 'SELL'].includes(type.toUpperCase())) {
                return errorResponse(res, httpCodes.badReq, "Invalid trade type. Must be BUY or SELL");
            }

            // Try to get Binance prices from cache
            const cacheKey = `prices/${token.toUpperCase()}/${fiat.toUpperCase()}/${type.toUpperCase()}`;
            const binancePrices = cache.get(cacheKey);
            
            if (binancePrices) {
                const priceType = parts[1].toUpperCase();
                const priceIndex = {MIN: 0, MEDIAN: 1, MAX: 2}[priceType];
                return successResponse(res, Messages.success, { 
                    [token]: { [fiat]: binancePrices[priceIndex] }
                });
            }
            
            // If price not cached, fetch new prices from Binance
            await binancePriceService.fetchPrices(token, fiat, type.toUpperCase());
            const freshPrices = cache.get(cacheKey);
            if (!freshPrices) {
                return errorResponse(
                    res, 
                    httpCodes.badReq, 
                    `Failed to fetch Binance ${type.toUpperCase()} prices for ${token}/${fiat}`
                );
            }

            const priceType = parts[1].toUpperCase();
            const priceIndex = {MIN: 0, MEDIAN: 1, MAX: 2}[priceType];
            return successResponse(res, Messages.success, { 
                [token]: { [fiat]: freshPrices[priceIndex] }
            });
        }

        // If we get here, no price source was able to provide data
        return errorResponse(res, httpCodes.badReq, "Failed to fetch prices");
        
    } catch (error) {
        console.error("Price fetch error:", error);
        return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
};

// cache inspection
exports.inspectCache = async (req, res) => {
    try {
        const allCacheKeys = cache.keys();
        const cacheContents = {};
        
        for (const key of allCacheKeys) {
            cacheContents[key] = cache.get(key);
        }
        
        return successResponse(res, "Cache contents", cacheContents);
    } catch (error) {
        console.error("Cache inspection error:", error);
        return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
};