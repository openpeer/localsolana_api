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
exports.getbanks = async (req, res) => {
  try {
    const banks = await models.banks.findAll();
    const BANK_IMAGES_BASE_URL = process.env.BANK_IMAGES_BASE_URL;
    console.log('BANK_IMAGES_BASE_URL:', BANK_IMAGES_BASE_URL);

    const banksWithImageUrl = banks.map(bank => {
      console.log('Bank image:', bank.image);
      if (bank.image) {
        bank.dataValues.imageUrl = `${BANK_IMAGES_BASE_URL}/${bank.image}`;
      } else {
        bank.dataValues.imageUrl = null;
      }
      return bank;
    });

    return successResponse(res, Messages.fetchedBanks, banksWithImageUrl);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};
  exports.getBanksByCurrency = async (req, res) => {
    try {
      const currency_id = req.query.currency_id;
      if (!currency_id) {
        return errorResponse(res, httpCodes.badReq, "currency_id is required");
      }
  
      const bankIds = await models.banks_fiat_currencies.findAll({
        attributes: ['bank_id'],
        where: {
          fiat_currency_id: currency_id
        }
      });
  
      const BANK_IMAGES_BASE_URL = process.env.BANK_IMAGES_BASE_URL;
  
      let banksList = [];
      if (bankIds.length > 0) {
        for (const bankId of bankIds) {
          let particularBanks = await models.banks.findOne({
            where: {
              id: bankId.bank_id
            }
          });
          particularBanks.dataValues["icon"] = `${BANK_IMAGES_BASE_URL}/${particularBanks.image}`;
          banksList.push(particularBanks);
        }
      } else {
        return errorResponse(res, httpCodes.badReq, Messages.noBanksFound);
      }
  
      return successResponse(res, Messages.fetchedBanks, banksList);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
  };