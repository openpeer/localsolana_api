const axios = require("axios");
const cron = require("node-cron");
const NodeCache = require("node-cache");
require("dotenv").config();
const models = require("../models");

class AutomaticPriceFetcher {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // Cache expires in 1 hour
    this.baseUrl = "https://pro-api.coingecko.com/api/v3/simple/price";
  }

  /**
   * Starts the cron job to fetch prices every hour.
   */
  startCron() {
    console.log("Starting price fetching cron job...");
    cron.schedule("0 * * * *", async () => {
      console.log("Fetching token prices...");
      const tokens = await models.tokens.findAll({
        attributes: ["coingecko_id"],
      });
      const currencies = await models.fiat_currencies.findAll({
        attributes: ["code"],
      });
      const ids = [];
      for (let i = 0; i < tokens.length; i++) {
        ids.push(tokens[i].coingecko_id);
      }
      const currencyIds = [];
      for (let i = 0; i < currencies.length; i++) {
        currencyIds.push(currencies[i].code.toLowerCase());
      }
      console.log('Fetching price for ' + currencyIds.join(','),'for tokens',ids);
      await this.fetchTokenPrices(ids, currencyIds);
    });
  }

  /**
   * Fetches token prices from CoinGecko and caches the results.
   * @param {Array<string>} ids - Array of coin IDs (e.g., ['bitcoin', 'ethereum']).
   * @param {Array<string>} currencies - Array of currencies (e.g., ['usd', 'eur']).
   */
  async fetchTokenPrices(ids, currencies) {
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

        // Cache each coin-currency pair
        Object.keys(prices).forEach((coin) => {
          Object.keys(prices[coin]).forEach((currency) => {
            const cacheKey = `prices/${coin}/${currency}`;
            this.cache.set(cacheKey, prices[coin][currency]);
            console.log(`Cached ${cacheKey}: ${prices[coin][currency]}`);
          });
        });
      }
    } catch (error) {
      console.error("Error fetching token prices:", error.message);
    }
  }

  /**
   * Fetches cached token prices.
   * @param {string} id - The coin ID (e.g., 'bitcoin').
   * @param {string} currency - The currency (e.g., 'usd').
   * @returns {number|null} - The cached price or null if not found.
   */
  getCachedPrice(id, currency) {
    const cacheKey = `prices/${id}/${currency}`;
    return this.cache.get(cacheKey) || null;
  }
}

module.exports = AutomaticPriceFetcher;
