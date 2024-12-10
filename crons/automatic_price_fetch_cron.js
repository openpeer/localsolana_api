const axios = require("axios");
const cron = require("node-cron");
const {cache} = require('../utils/cache');
require("dotenv").config();
const models = require("../models");
const chalk = require('chalk');

class AutomaticPriceFetcher {
  constructor() {
    this.baseUrl = "https://pro-api.coingecko.com/api/v3/simple/price";
  }

  /**
   * Starts the cron job to fetch prices every hour.
   */
  startCron() {
    console.log(chalk.bgBlue.white.bold("🕒 STARTING PRICE FETCHING CRON JOB..."));
    cron.schedule("40 * * * *", async () => {
      console.log(chalk.bgYellow.black.bold("⚡ FETCHING TOKEN PRICES..."));
      await this.fetchTokenPrices();
    });
  }

  /**
   * Fetches token prices from CoinGecko and caches the results.
   * @param {Array<string>} ids - Array of coin IDs (e.g., ['bitcoin', 'ethereum']).
   * @param {Array<string>} currencies - Array of currencies (e.g., ['usd', 'eur']).
   */
  async fetchTokenPrices() {
    const tokens = await models.tokens.findAll({
        attributes: ["coingecko_id"],
      });
      const currencyCodes = await models.fiat_currencies.findAll({
        attributes: ["code"],
      });
      const ids = [];
      for (let i = 0; i < tokens.length; i++) {
        ids.push(tokens[i].coingecko_id);
      }
      const currencies = [];
      for (let i = 0; i < currencyCodes.length; i++) {
        currencies.push(currencyCodes[i].code.toLowerCase());
      }
      console.log(chalk.bgMagenta.white.bold('🎯 FETCHING PRICES:'), 
        chalk.cyan(`${currencies.length} currencies`),
        chalk.bgMagenta.white.bold('FOR'),
        chalk.cyan(`${ids.length} tokens`)
      );
    const idsParam = ids.join(",");
    const currenciesParam = currencies.join(",");

    try {
      const response = await axios.get(this.baseUrl, {
        params: { ids: idsParam, vs_currencies: currenciesParam },
        headers: {
          accept: "application/json",
          "x-cg-pro-api-key": process.env.COINGECKO_API_KEY,
        },
      });

      if (response.status === 200) {
        const prices = response.data;
        console.log(chalk.bgGreen.black.bold('💰 PRICES CACHED:'));
        
        // Cache each coin-currency pair
        Object.keys(prices).forEach((coin) => {
          Object.keys(prices[coin]).forEach((curr) => {
            // Use coingecko_id in lowercase for consistency
            const cacheKey = `prices/${coin.toLowerCase()}/${curr.toLowerCase()}`;
            cache.set(cacheKey, prices[coin][curr]);
            console.log(chalk.cyan(`  ${cacheKey}:`), 
              chalk.green(prices[coin][curr])
            );
          });
        });
      }
    } catch (error) {
      console.error(chalk.bgRed.white.bold('❌ ERROR FETCHING TOKEN PRICES:'), 
        chalk.red(error.message)
      );
    }
  }

  async fetchSingleTokenPrice(id, currency) {
    try {
      console.log(chalk.bgYellow.black.bold('🔍 FETCHING SINGLE TOKEN PRICE:'), 
        chalk.cyan(`${id}/${currency}`)
      );

      const response = await axios.get(this.baseUrl, {
        params: { ids: id, vs_currencies: currency },
        headers: {
          accept: "application/json",
          "x-cg-pro-api-key": process.env.COINGECKO_API_KEY,
        },
      });
  
      if (response.status === 200) {
        const prices = response.data;
        console.log(chalk.bgGreen.black.bold('💰 SINGLE PRICE DATA:'), 
          chalk.yellow(JSON.stringify(prices, null, 2))
        );
  
        // Cache each coin-currency pair with the correct key format
        Object.keys(prices).forEach((coin) => {
          Object.keys(prices[coin]).forEach((curr) => {
            // Use uppercase for consistency with Binance caching
            const cacheKey = `prices/${coin.toUpperCase()}/${curr.toUpperCase()}`;
            cache.set(cacheKey, prices[coin][curr]);
            console.log(chalk.bgCyan.black.bold(`📝 CACHED PRICE ${cacheKey}:`), 
              chalk.green(prices[coin][curr])
            );
          });
        });
      }
    } catch (error) {
      console.error(chalk.bgRed.white.bold('❌ ERROR FETCHING SINGLE TOKEN PRICE:'), 
        chalk.red(error.message)
      );
    }
  }
}

module.exports = AutomaticPriceFetcher;
