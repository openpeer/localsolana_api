const models = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');

// method for creating the banks
exports.createBanks = async function(req, res){
    const { name, account_info_schema, color, image, fiatCurrencies } = req.body;
    try {
      const banksPayload = {
        name, account_info_schema, color, image, fiatCurrencies
      }
      const createdBank = await models.banks.create(banksPayload);
      if(createdBank.id){
        let symbolFetched = createdBank.fiatCurrencies;
        let separatedCurrencies  =  symbolFetched.split(',');
          for (const separatedCurrency of separatedCurrencies) {
          let getFiatCurrency = await models.fiat_currencies.findOne({
            where: {
              symbol: separatedCurrency
            }
          });
          let payload = {
            bank_id: createdBank.id,
            fiat_currency_id: getFiatCurrency.id
          }
          let dataEntryToTable = await models.banks_fiat_currencies.create(payload);
           console.log("dataEntryToTable", dataEntryToTable);
        }
      }else{
        return errorResponse(res, httpCodes.badReq,Messages.bankError);
      }
      return successResponse(res, Messages.success, createdBank);
    } catch (error) {
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
}

// Read All the banks
exports.getbanks =  async (req, res) => {
    try {
      const banks = await models.banks.findAll();
      return successResponse(res, Messages.fetchedBanks, banks);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };

exports.getBanksByCurrency =  async (req, res) => {
  try {
    const currency_id = req.query.currency_id;
    console.log("currency_id",currency_id);
    const bankIds = await models.banks_fiat_currencies.findAll({
      attributes: ['bank_id'],
      where: {
        fiat_currency_id: currency_id
      }
    });
    const fiatCurrency = await models.fiat_currencies.findAll({
      attributes: ['country_code'],
      where: {
        id: currency_id
      }
    });
    console.log("fiatCurrency", fiatCurrency[0].dataValues.country_code);
    let banksList = [];
    if(bankIds.length > 0) {
      
      for (const bankId of bankIds) {
        let particularBanks = await models.banks.findOne({
          where: {
            id: bankId.bank_id
          }
        });
        particularBanks.dataValues["icon"] = fiatCurrency[0].dataValues.country_code;
        banksList.push(particularBanks);
    }
  }else{
    return errorResponse(res, httpCodes.badReq,Messages.noBanksFound);

  }
    console.log("banks Ids", banksList);
    
    return successResponse(res, Messages.fetchedBanks,banksList);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError,Messages.systemError);
  }
};