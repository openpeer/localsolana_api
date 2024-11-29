// controllers/prices.controller.js

require("dotenv").config();
const {getCachedPrice, cache} = require('../utils/cache');
const AutomaticPriceFetchCron = require("../crons/automatic_price_fetch_cron");
const binancePriceService = require('../services/binancePriceService');
const {errorResponse, successResponse} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');

exports.fetchData = async (req, res) => {
    try {
        const {token, fiat, source = 'coingecko', type = 'BUY'} = req.query; 

        // Validate required parameters
        if (!token || !fiat) {
            return errorResponse(res, httpCodes.badReq, "Token and fiat parameters are required");
        }

        // Handle Binance P2P price requests
        if (source.startsWith('binance_')) {
            // Validate source parameter format
            const parts = source.split('_');
            if (parts.length !== 2 || !['MIN', 'MEDIAN', 'MAX'].includes(parts[1].toUpperCase())) {
                return errorResponse(res, httpCodes.badReq, "Invalid Binance price source format. Use: binance_[MIN|MEDIAN|MAX]");
            }

            // Validate trade type
            if (!['BUY', 'SELL'].includes(type.toUpperCase())) {
                return errorResponse(res, httpCodes.badReq, "Invalid trade type. Must be BUY or SELL");
            }

            const cacheKey = `prices/${token.toUpperCase()}/${fiat.toUpperCase()}/${type.toUpperCase()}`;
            const binancePrices = cache.get(cacheKey);
            
            if (binancePrices) {
                // Map price type to array index (MIN=0, MEDIAN=1, MAX=2)
                const priceType = parts[1].toUpperCase();
                const priceIndex = {MIN: 0, MEDIAN: 1, MAX: 2}[priceType];
                return successResponse(res, Messages.success, { 
                    [token]: { [fiat]: binancePrices[priceIndex] }
                });
            }
            
            // If price not cached, fetch new prices
            await binancePriceService.fetchPrices(token, fiat, type.toUpperCase());
            const freshPrices = cache.get(cacheKey);
            if (!freshPrices) {
                return errorResponse(res, httpCodes.badReq, `Failed to fetch Binance ${type.toUpperCase()} prices for ${token}/${fiat}`);
            }

            const priceType = parts[1].toUpperCase();
            const priceIndex = {MIN: 0, MEDIAN: 1, MAX: 2}[priceType];
            return successResponse(res, Messages.success, { 
                [token]: { [fiat]: freshPrices[priceIndex] }
            });
        }

        // Handle CoinGecko price requests
        let cachedPrice = getCachedPrice(token, fiat);
        if (cachedPrice != null) {
            return successResponse(res, Messages.success, { 
                [token]: { [fiat]: cachedPrice }
            });
        }

        // If price not cached, fetch new price
        const priceCron = new AutomaticPriceFetchCron();
        await priceCron.fetchSingleTokenPrice(token, fiat);
        
        cachedPrice = getCachedPrice(token, fiat);
        if (cachedPrice != null) {
            return successResponse(res, Messages.success, { 
                [token]: { [fiat]: cachedPrice }
            });
        }

        return errorResponse(res, httpCodes.badReq, "Failed to fetch prices");
        
    } catch (error) {
        console.error("Price fetch error:", error);
        return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
}