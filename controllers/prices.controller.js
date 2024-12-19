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

            // Special handling for SOL prices
            if (token.toUpperCase() === 'SOL') {
                const solCacheKey = `_solanaCalculations/SOL/${fiat.toUpperCase()}/${type.toUpperCase()}`;
                const solPrice = cache.get(solCacheKey);
                
                // Handle both new (direct number) and old (nested object) formats
                const priceValue = typeof solPrice === 'number' ? 
                    solPrice : 
                    (solPrice?.value?.value || solPrice?.value);
                
                if (priceValue !== undefined && !isNaN(priceValue)) {
                    return successResponse(res, Messages.success, { 
                        [token]: { [fiat]: priceValue }
                    });
                }

                // If no cached price, try to fetch fresh SOL prices
                try {
                    const freshSolPrice = await binancePriceService.fetchSOLPrices(fiat, type.toUpperCase());
                    if (freshSolPrice) {
                        return successResponse(res, Messages.success, { 
                            [token]: { [fiat]: freshSolPrice }
                        });
                    }
                } catch (error) {
                    console.error('Error fetching SOL prices:', error);
                }

                // If we still don't have a price, try the USDT calculation path
                const usdtKey = `prices/USDT/${fiat.toUpperCase()}/${type.toUpperCase()}`;
                const solUsdKey = 'prices/solana/usd';
                const usdtPrices = cache.get(usdtKey);
                const solUsdPrice = cache.get(solUsdKey);

                if (usdtPrices && solUsdPrice) {
                    const medianIndex = Math.floor(usdtPrices.length / 2);
                    const calculatedPrice = Number((usdtPrices[medianIndex] * solUsdPrice).toFixed(4));
                    
                    if (!isNaN(calculatedPrice)) {
                        return successResponse(res, Messages.success, { 
                            [token]: { [fiat]: calculatedPrice }
                        });
                    }
                }
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
        const now = Date.now();
        
        // Get standard cache contents first
        for (const key of allCacheKeys) {
            const value = cache.get(key);
            const ttl = cache.getTtl(key);
            
            cacheContents[key] = {
                value: value,
                ttl: ttl,
                timeLeft: ttl ? Math.round((ttl - now) / 1000) : null,
                age: ttl ? Math.round((now - ttl) / 1000) : null
            };
        }

        // Add calculated Solana prices section
        const solUsdtCache = cache.get('prices/SOL/USDT/SPOT');
        if (solUsdtCache) {
            const solanaCalculations = {
                spotPrice: solUsdtCache.value,
                calculatedPrices: {}
            };

            // Get all USDT prices for Binance-supported currencies
            for (const key of allCacheKeys) {
                if (key.match(/^prices\/USDT\/[A-Z]+\/(BUY|SELL)$/)) {
                    const [, , fiat, type] = key.split('/');
                    const usdtPrices = cache.get(key);
                    
                    if (Array.isArray(usdtPrices) && usdtPrices.length === 3) {
                        const calculated = usdtPrices.map(price => 
                            Number((price * solUsdtCache.value).toFixed(4))
                        );
                        
                        solanaCalculations.calculatedPrices[`SOL/${fiat}/${type}`] = {
                            calculated,
                            basedOn: {
                                usdtPrices,
                                solUsdtRate: solUsdtCache.value
                            }
                        };
                    }
                }
            }

            cacheContents['_solanaCalculations'] = solanaCalculations;
        }
        
        return successResponse(res, "Cache contents with TTL information", cacheContents);
    } catch (error) {
        console.error("Cache inspection error:", error);
        return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
};
exports.getPairPrice = (req, res) => {
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
};

const updateCachePrice = async (cacheKey, fetchPriceFunc) => {
    const currentPrice = cache.get(cacheKey);
    
    try {
        const newPrice = await fetchPriceFunc();
        if (newPrice) {
            cache.set(cacheKey, newPrice);
            return newPrice;
        }
        return currentPrice; // Fallback to current price if fetch fails
    } catch (error) {
        console.error(`Failed to fetch new price for ${cacheKey}:`, error);
        return currentPrice; // Keep existing price on error
    }
};