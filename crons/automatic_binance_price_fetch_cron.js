const cron = require("node-cron");
const models = require("../models");
const binancePriceService = require("../services/binancePriceService");

class AutomaticBinancePriceFetcher {
  startCron() {
    console.log("Starting Binance price fetching cron job...");
    cron.schedule("*/30 * * * *", async () => {
      console.log("Fetching Binance token prices...");
      await this.fetchAllPrices();
    });
  }

  async fetchAllPrices() {
    try {
      // Get tokens and fiats that are configured for Binance rates
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
        return;
      }

      console.log(`Fetching Binance prices for ${tokens.length} tokens and ${fiats.length} fiats`);

      // Fetch both BUY and SELL prices for each token-fiat pair
      for (const token of tokens) {
        for (const fiat of fiats) {
          try {
            await binancePriceService.fetchPrices(token.symbol, fiat.code, 'BUY');
            await binancePriceService.fetchPrices(token.symbol, fiat.code, 'SELL');
          } catch (error) {
            console.error(`Failed to fetch Binance prices for ${token.symbol}/${fiat.code}:`, error);
            // Continue with next pair even if one fails
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error in Binance price fetch cron:", error);
    }
  }
}

module.exports = AutomaticBinancePriceFetcher;