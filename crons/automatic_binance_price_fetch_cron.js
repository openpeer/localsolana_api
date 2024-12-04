// crons/automatic_binance_price_fetch_cron.js

const cron = require("node-cron");
const models = require("../models");
const binancePriceService = require("../services/binancePriceService");

class AutomaticBinancePriceFetcher {
  constructor() {
    // CHANGE: Added class properties for configuration
    this.CRON_SCHEDULE = "*/30 * * * *"; // Runs every 30 minutes
    this.SUPPORTED_TOKENS = ["SOL"]; // Currently only supporting SOL
    this.MAX_CONCURRENT_REQUESTS = 3; // Limit concurrent API calls
  }

  startCron() {
    // CHANGE: Added more detailed logging
    console.log(`Starting Binance P2P price fetching cron job (Schedule: ${this.CRON_SCHEDULE})...`);
    
    // CHANGE: Added error handling wrapper around cron execution
    cron.schedule(this.CRON_SCHEDULE, async () => {
      try {
        console.log("Executing Binance P2P price fetch...");
        await this.fetchAllPrices();
      } catch (error) {
        console.error("Error in Binance price fetch cron execution:", error);
      }
    });
  }

  async fetchAllPrices() {
    try {
      // CHANGE: Added validation for configured tokens and fiats
      const tokens = await models.tokens.findAll({
        where: { 
          allow_binance_rates: true,
        },
        attributes: ["symbol"]
      });

      const fiats = await models.fiat_currencies.findAll({
        where: { allow_binance_rates: true },
        attributes: ["code"]
      });

      // CHANGE: Added validation logging
      if (!tokens.length || !fiats.length) {
        console.log("No tokens or fiats configured for Binance rates");
        console.log(`Tokens found: ${tokens.length}, Fiats found: ${fiats.length}`);
        return;
      }

      console.log(`Fetching Binance P2P prices for ${tokens.length} tokens and ${fiats.length} fiats`);

      // CHANGE: Added batch processing to limit concurrent requests
      for (let i = 0; i < tokens.length; i += this.MAX_CONCURRENT_REQUESTS) {
        const batch = tokens.slice(i, i + this.MAX_CONCURRENT_REQUESTS);
        
        // Process batch concurrently
        await Promise.all(batch.map(async (token) => {
          for (const fiat of fiats) {
            try {
              // CHANGE: Added detailed logging for each fetch
              console.log(`Fetching ${token.symbol}/${fiat.code} prices...`);
              
              // Fetch both BUY and SELL prices
              await Promise.all([
                binancePriceService.fetchPrices(token.symbol, fiat.code, 'BUY'),
                binancePriceService.fetchPrices(token.symbol, fiat.code, 'SELL')
              ]);

              console.log(`Successfully fetched ${token.symbol}/${fiat.code} prices`);
            } catch (error) {
              // CHANGE: Added structured error logging
              console.error({
                error: "Failed to fetch Binance prices",
                token: token.symbol,
                fiat: fiat.code,
                message: error.message,
                stack: error.stack
              });
              // Continue with next pair even if one fails
              continue;
            }
          }
        }));
      }

      // CHANGE: Added completion logging
      console.log("Completed Binance P2P price fetch cycle");
    } catch (error) {
      // CHANGE: Added detailed error logging for main try-catch
      console.error("Critical error in Binance price fetch cron:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      throw error; // Re-throw to be caught by the cron wrapper
    }
  }
}

module.exports = AutomaticBinancePriceFetcher;