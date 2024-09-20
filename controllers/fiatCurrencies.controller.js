const models = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');

// method for adding the fiat currencies
exports.createFiatCurrencies = async function(req, res){
    const { code, name, symbol, country_code, position, allow_binance_rates, default_price_source } = req.body;
    try {
      const fiatCurrencies = {
        code, name, symbol, country_code, position, allow_binance_rates, default_price_source
      }
      const data = await models.fiat_currencies.create(fiatCurrencies);
      return successResponse(res, Messages.success, data);
    } catch (error) {
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
}

// Read All Fiat Currencies
exports.getFiatCurrencies =  async (req, res) => {
    try {
      const fiatCurrencies = await models.fiat_currencies.findAll();
      fiatCurrencies?.forEach(element => {
        element.dataValues["icon"] = element.dataValues.country_code;
      });
      return successResponse(res, Messages.getFiatCurrencies, fiatCurrencies);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Read Fiat Currencies by Id
  exports.getFiatCurrency =  async (req, res) => {
    const { id } = req.params;
    try {
      const fiatCurrency = await models.fiat_currencies.findByPk(id);
      if (!fiatCurrency) {
        return errorResponse(res, httpCodes.badReq,Messages.fiatCurrencyNotFound);
      }
      console.log("fiatCurrency", fiatCurrency);
      fiatCurrency.dataValues["icon"] = fiatCurrency.dataValues.country_code;
      return successResponse(res, Messages.getFiatCurrency, fiatCurrency);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Update Fiat Currency
  exports.updateFiatCurrencies =  async (req, res) => {
    const { id } = req.params;
    const { code, name, symbol, country_code, position, allow_binance_rates, default_price_source } = req.body;
    try {
      const fiatCurrency = await models.fiat_currencies.findByPk(id);
      if (!fiatCurrency) {
        return errorResponse(res, httpCodes.badReq,Messages.fiatCurrencyNotFound);
      }
      fiatCurrency.code = code;
      fiatCurrency.name = name;
      fiatCurrency.symbol = symbol;
      fiatCurrency.country_code = country_code;
      fiatCurrency.position = position;
      fiatCurrency.allow_binance_rates = allow_binance_rates;
      fiatCurrency.default_price_source = default_price_source;
      let updatedFiatCurrency = await fiatCurrency.save();
      return successResponse(res, Messages.updateFiatCurrency, updatedFiatCurrency);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Delete Fiat Currency
  exports.deleteFiatCurrency =  async (req, res) => {
    const { id } = req.params;
    try {
      const fiatCurrency = await models.fiat_currencies.findByPk(id);
      if (!fiatCurrency) {
        return errorResponse(res, httpCodes.badReq,Messages.fiatCurrencyNotFound)
      }
      await fiatCurrency.destroy();
      return successResponse(res, Messages.deletedSuccessfully);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  