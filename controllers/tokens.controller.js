const models = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
const {validationSchemaForToken} = require('../validate/token.validate');

// method for creating the token
exports.createToken = async function(req, res){
    const { address, decimals, symbol,name, chain_id, coingecko_id, coinmarketcap_id, gasless, position, minimum_amount, allow_binance_rates, description } = req.body;
    try {
      const newTokenSetting = {
        address, decimals, symbol,name, chain_id, coingecko_id, coinmarketcap_id, gasless, position, minimum_amount, allow_binance_rates, description
      }
      const tokenCreated = await models.tokens.create(newTokenSetting);
      return successResponse(res, Messages.success, tokenCreated);
    } catch (error) {
      console.log(error);
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
}

// Read All Tokens 
exports.getadminTokens =  async (req, res) => {
    try {
      const adminTokens = await models.tokens.findAll();
      return successResponse(res, Messages.getTokens, adminTokens);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Get Token by ID
  exports.getAdminToken =  async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = validationSchemaForToken.validate(req.params);
      if (error) {
        return res.status(400).json({ errors: error.details.map(err => err.message) });
      }
      const adminToken = await models.tokens.findOne({
        where: {
          chain_id: id
        }
      });
      if (!adminToken) {
        return errorResponse(res, httpCodes.badReq,Messages.tokenNotFound);
      }
      return successResponse(res, Messages.getTokens, adminToken);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Update Admin Token
  exports.updateAdminToken =  async (req, res) => {
    const { id } = req.params;
    const { address, decimals, symbol,name, chain_id, coingecko_id, coinmarketcap_id, gasless, position, minimum_amount, allow_binance_rates, description } = req.body;
    try {
      const adminToken = await models.tokens.findOne({
        where: {
          chain_id: id
        }});
      if (!adminToken) {
        return errorResponse(res, httpCodes.badReq,Messages.tokenNotFound);
      }
        adminToken.address = address,
        adminToken.decimals = decimals,
        adminToken.symbol = symbol,
        adminToken.name = name,
        adminToken.chain_id = chain_id,
        adminToken.coingecko_id = coingecko_id,
        adminToken.coinmarketcap_id = coinmarketcap_id,
        adminToken.gasless = gasless,
        adminToken.position = position,
        adminToken.minimum_amount = minimum_amount,
        adminToken.allow_binance_rates = allow_binance_rates,
        adminToken.description = description
      let updatedToken = await adminToken.save();
      return successResponse(res, Messages.updateToken, updatedToken);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Delete Admin Token
  exports.deleteAdminToken =  async (req, res) => {
    const { id } = req.params;
    try {
      const adminToken = await models.tokens.findByPk(id);
      if (!adminToken) {
        return errorResponse(res, httpCodes.badReq,Messages.tokenNotFound)
      }
      await adminToken.destroy();
      return successResponse(res, Messages.deletedSuccessfully);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  