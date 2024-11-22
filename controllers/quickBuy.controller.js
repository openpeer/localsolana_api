const models = require("../models/index");
const { sequelize } = require("../models");
const { errorResponse, successResponse } = require("../utils/rest");
const Messages = require("../utils/messages");
const httpCodes = require("../utils/httpCodes");
const priceSourceMethod = require("../utils/commonEnums");
const { Op } = require("sequelize");
const { getCachedPrice } = require("../utils/cache");

exports.quickBuy = async (req, res) => {
  try {
    const {
      type,
      fiat_currency_code,
      token_symbol,
      token_amount,
      fiat_amount,
    } = req.query;
    if (!token_amount && !fiat_amount) {
      return successResponse(res, "No result found", []);
    }

    const token = await models.tokens.findOne({
      where: { symbol: token_symbol },
    });
    const fiatCurrency = await models.fiat_currencies.findOne({
      where: { code: fiat_currency_code },
    });

    if (!token || !fiatCurrency) {
      return successResponse(res, "Token or Fiat Currency not found", []);
    }

    const whereConditions = {
      type: type,
      token_id: token.id,
      fiat_currency_id: fiatCurrency.id,
      status: 1,
    };

    if (token_amount && token_amount > 0) {
      whereConditions.total_available_amount = { [Op.gte]: token_amount };
    }

    if (fiat_amount && fiat_amount > 0) {
      //whereConditions.price = { [Op.gte]: fiat_amount };
  
      if (fiat_amount && fiat_amount > 0) {
        let token_price = getCachedPrice(token.dataValues.coingecko_id,fiat_currency_code);
        whereConditions[Op.and] = [
          {
            price: {
              [Op.gte]: sequelize.literal(`
                ${fiat_amount} / (CASE 
                  WHEN margin_type = 0 THEN margin
                  ELSE (${token_price} + (${token_price} * margin / 100))
                END)
              `)
            }
          },
          {
            [Op.or]: [
              { limit_min: { [Op.lte]: fiat_amount } },
              { limit_min: { [Op.is]: null } },
            ],
          },
          {
            [Op.or]: [
              { limit_max: { [Op.gte]: fiat_amount } },
              { limit_max: { [Op.is]: null } },
            ],
          },
        ];
      }
  }
    console.log('Where confitions are:'.whereConditions);

    // Fetch the results
    let results = await models.lists.findAll({
      where: whereConditions,
     // order: [['price', 'ASC']],
    });
  
    if (!results) return successResponse(res, "No result found", []);
    let output = [];
    for (let resultdata of results) {
      let bankIdsData = [];
      if (type === "SellList") {
        const result = await fetchedListLoop(resultdata);
        output.push(result);
      } else if (type === "BuyList") {
        const bankIds = await models.lists_banks.findAll({
          attributes: ["bank_id"],
          where: {
            list_id: resultdata.id,
          },
        });

        // Extract bank IDs and push to bankIdsData array
        bankIds.forEach((record) => {
          let banks = record.dataValues.bank_id;
          bankIdsData.push(banks);
        });

        // Fetch the result using fetchedListLoop
        const fetchedResult = await fetchedListLoop(resultdata, bankIdsData);

        // Push the fetched result to the output array
        output.push(fetchedResult);
      } else {
      }
    }
    return successResponse(res, Messages.getList, output);
  } catch (error) {
    console.log(error);
  }
};

async function fetchedListLoop(element, banksIds = null) {
  return new Promise(async (resolve) => {
    let banksData = [];
    //  console.log("banksIds", banksIds)
    if (banksIds) {
      for (let item of banksIds) {
        //   console.log("------------bank Id", item)
        let particularBankData = await models.banks.findByPk(item);
        //   console.log("particularBankData", particularBankData);
        let data = particularBankData.dataValues; // Extract data values from each record
        //    console.log("data------------------",data)
        banksData.push(data);
      }
    }
    //    console.log("element.dataValues.bank_id", element.dataValues.bank_id);

    let fiatCurrencyData;
    if (element.fiat_currency_id !== "" || element.fiat_currency_id !== null) {
      fiatCurrencyData = await models.fiat_currencies.findByPk(
        element.fiat_currency_id
      );
    }
    let tokenData;
    if (element.token_id !== "" || element.token_id !== null) {
      tokenData = await models.tokens.findByPk(element.token_id);
    }

    let totalPaymentMethods = [];
    const paymentMethodsIds = await models.lists_payment_methods.findAll({
      attributes: ["payment_method_id"],
      where: {
        list_id: element.id,
      },
    });
    //console.log("paymentMethodsIds", paymentMethods);
    if (
      element.payment_method_id !== "" ||
      element.payment_method_id !== null
    ) {
      for (let item of paymentMethodsIds) {
        let paymentMethodsData = await models.payment_methods.findAll({
          where: {
            id: item.dataValues.payment_method_id,
            user_id: element.seller_id,
          },
        });
        for (let record of paymentMethodsData) {
          let paymentMethodData = record.dataValues; // Extract data values from each record
          //  console.log(" -------------------paymentMethodData", paymentMethodData);
          let particularBankData = await models.banks.findByPk(
            paymentMethodData.bank_id
          );
          //   console.log("------------------banks --------", particularBankData);
          paymentMethodData["bank"] = particularBankData;
          totalPaymentMethods.push(paymentMethodData); // Push the processed data to the final array
        }
      }
    }
    let userData;
    if (element.seller_id !== "" || element.seller_id !== null) {
      userData = await models.user.findByPk(element.seller_id);
      let contracts = await models.contracts.findAll({
        where: {
          user_id: element.seller_id,
          chain_id: element.chain_id,
        },
      });
      //console.log("contracts", contracts);
      userData.dataValues["contracts"] = contracts;
      //console.log("userData", userData);
    }

    //added logic for handling floating rate changes
    let calculatedPrice = element.dataValues.price;
    if (element.margin_type == 1) {
      console.log(
        "floating rate for",
        tokenData.dataValues.coingecko_id,
        fiatCurrencyData.dataValues.code
      );
      let price = getCachedPrice(
        tokenData.dataValues.coingecko_id,
        fiatCurrencyData.dataValues.code
      );
      console.log("Cached Price:", price);
      let margin = element.margin;
      let total = price + (price * margin) / 100;
      calculatedPrice = total;
      console.log("Calculated Price:", calculatedPrice);
    }

    let response = {
      id: element.id,
      automatic_approval: element.automatic_approval,
      chain_id: element.chain_id,
      limit_min: element.limit_min,
      limit_max: element.limit_max,
      price: calculatedPrice,
      margin_type: element.margin_type,
      margin: element.margin,
      status: element.status,
      terms: element.terms,
      token: element.token_id,
      bank: banksData,
      total_available_amount: element.total_available_amount,
      type: element.type,
      deposit_time_limit: element.deposit_time_limit,
      payment_time_limit: element.payment_time_limit,
      accept_only_verified: element.accept_only_verified,
      escrow_type: element.escrow_type == 0 ? "manual" : "instant",
      price_source: priceSourceMethod.priceSourceFunction(element.price_source),
      fiat_currency: fiatCurrencyData,
      token: tokenData,
      payment_methods: totalPaymentMethods,
      seller: userData,
    };
    ///  console.log("response", response)
    resolve(response);
  });
}
