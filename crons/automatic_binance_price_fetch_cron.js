const models = require('../models');
const binancePriceService = require('../services/binancePriceService');
const cron = require('node-cron');

class AutomaticBinancePriceFetcher {
  constructor() {
    this.binancePriceService = binancePriceService;
    this.CRON_SCHEDULE = "*/30 * * * *";
  }

  startCron() {
    console.log('Starting Binance P2P price fetching cron job (Schedule: ' + this.CRON_SCHEDULE + ')...');
    
    // Initial fetch on startup (only once)
    console.log('Running initial Binance price fetch...');
    this.fetchAllPrices().catch(error => {
      console.error('Error in initial Binance price fetch:', error);
    });

    // Schedule subsequent fetches
    cron.schedule(this.CRON_SCHEDULE, async () => {
      console.log('Running scheduled Binance price fetch...');
      try {
        await this.fetchAllPrices();
      } catch (error) {
        console.error('Error in scheduled Binance price fetch:', error);
      }
    });
  }

  async fetchAllPrices() {
    try {
      const tokens = await models.tokens.findAll({
        where: { allow_binance_rates: true },
        attributes: ["symbol"]
      });

      const fiats = await models.fiat_currencies.findAll({
        where: { allow_binance_rates: true },
        attributes: ["code"]
      });

      if (!tokens.length || !fiats.length) {
        console.log("No tokens or fiats configured for Binance rates");
        console.log(`Tokens found: ${tokens.length}, Fiats found: ${fiats.length}`);
        return;
      }

      console.log(`Fetching Binance P2P prices for ${tokens.length} tokens and ${fiats.length} fiats`);
      const results = await this.binancePriceService.fetchAllPrices(tokens, fiats);
      console.log("Binance price fetch results:", results);
    } catch (error) {
      console.error("Critical error in Binance price fetch cron:", error);
      throw error;
    }
  }
}

module.exports = AutomaticBinancePriceFetcher;