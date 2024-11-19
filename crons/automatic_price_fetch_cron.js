const axios = require("axios");
const cron = require("node-cron");
const {cache} = require('../utils/cache');
require("dotenv").config();
const models = require("../models");

class AutomaticPriceFetcher {
  constructor() {
    this.baseUrl = "https://pro-api.coingecko.com/api/v3/simple/price";
  }

  /**
   * Starts the cron job to fetch prices every hour.
   */
  startCron() {
    console.log("Starting price fetching cron job...");
    cron.schedule("0 * * * *", async () => {
      console.log("Fetching token prices...");
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
      console.log('Fetching price for ' + currencies.join(','),'for tokens',ids);
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
        console.log('prices',prices);

        // Cache each coin-currency pair
        Object.keys(prices).forEach((coin) => {
          Object.keys(prices[coin]).forEach((currency) => {
            const cacheKey = `prices/${coin}/${currency}`;
            cache.set(cacheKey, prices[coin][currency]);
            //console.log(`Cached ${cacheKey}: ${prices[coin][currency]}`);
          });
        });
      }
    } catch (error) {
      console.error("Error fetching token prices:", error.message);
    }
  }

  async fetchSingleTokenPrice(id,currency) {

    try {
      const response = await axios.get(this.baseUrl, {
        params: { ids: id, vs_currencies: currency },
        headers: {
          accept: "application/json",
          "x-cg-pro-api-key": process.env.COINGECKO_API_KEY,
        },
      });

      if (response.status === 200) {
        const prices = response.data;
        console.log('prices',prices);

        // Cache each coin-currency pair
        Object.keys(prices).forEach((coin) => {
          Object.keys(prices[coin]).forEach((currency) => {
            const cacheKey = `prices/${coin}/${currency}`;
            cache.set(cacheKey, prices[coin][currency]);
            //console.log(`Cached ${cacheKey}: ${prices[coin][currency]}`);
          });
        });
      }
    } catch (error) {
      console.error("Error fetching token prices:", error.message);
    }
  }
}

module.exports = AutomaticPriceFetcher;
