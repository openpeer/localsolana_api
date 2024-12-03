const models = require("../models/index");
const { errorResponse, successResponse } = require("../utils/rest");
const Messages = require("../utils/messages");
const httpCodes = require("../utils/httpCodes");
const priceSourceMethod = require("../utils/commonEnums");
const { sequelize } = require("../models");
const { QueryTypes, where, and } = require("sequelize");
const { min } = require("moment");
const { Op } = require("sequelize");
const {isOnline} = require("../utils/util");
const { getCachedPrice } = require('../utils/cache');
const { cache } = require('../utils/cache');


// method for adding the fiat currencies
exports.createList = async function (req, res) {
  const {
    chain_id,
    seller_id,
    token_id,
    fiat_currency_id,
    total_available_amount,
    limit_min,
    limit_max,
    margin_type,
    margin,
    terms,
    automatic_approval,
    status,
    payment_method_id,
    type,
    bank_id,
    deposit_time_limit,
    payment_time_limit,
    accept_only_verified,
    escrow_type,
    price_source,
    price,
    payment_methods,
  } = req.body;

  try {
    // Validate price/margin based on margin_type
    if (margin_type === 1) { // Floating rate
      if (price !== null) {
        return errorResponse(res, httpCodes.badReq, "Price must be null for floating rate listings");
      }
      if (!margin) {
        return errorResponse(res, httpCodes.badReq, "Margin is required for floating rate listings");
      }
    } else { // Fixed rate
      if (!price) {
        return errorResponse(res, httpCodes.badReq, "Price is required for fixed rate listings");
      }
      if (margin !== null) {
        return errorResponse(res, httpCodes.badReq, "Margin must be null for fixed rate listings");
      }
    }

    const list = await models.lists.create({
      chain_id,
      seller_id,
      token_id,
      fiat_currency_id,
      total_available_amount,
      limit_min,
      limit_max,
      margin_type,
      margin,
      terms,
      automatic_approval,
      status,
      payment_method_id,
      type,
      bank_id,
      deposit_time_limit,
      payment_time_limit,
      accept_only_verified,
      escrow_type,
      price_source,
      price,
    });

    if (type === "BuyList" && payment_methods.length > 0) {
      const newBanksData = payment_methods.map((data) => ({
        list_id: list.dataValues.id,
        bank_id: data.bank.id,
      }));

      await sequelize.getQueryInterface().bulkInsert("lists_banks", newBanksData);
    } else if (type === "SellList" && payment_methods.length > 0) {
      payment_methods.forEach(async (params) => {
        const result = await models.payment_methods.findOne({
          where: {
            user_id: seller_id,
            bank_id: params.bank_id,
          },
        });

        let payment_method_id = 0;
        if (!result) {
          const payment_method_created = await models.payment_methods.create({
            user_id: seller_id,
            bank_id: params.bank_id,
            values: params.values,
            type: "ListPaymentMethod",
          });
          payment_method_id = payment_method_created.dataValues.id;
        } else {
          payment_method_id = result.dataValues.id;

          await models.payment_methods.update(
            {
              values: params.values,
            },
            {
              where: {
                user_id: seller_id,
                bank_id: params.bank_id,
              },
            }
          );
        }

        const check_existence_in_list_payment_methods =
          await models.lists_payment_methods.findOne({
            where: {
              list_id: list.dataValues.id,
              payment_method_id: payment_method_id,
            },
            attributes: ["list_id", "payment_method_id"],
          });

        if (!check_existence_in_list_payment_methods) {
          const result1 = await sequelize.query(
            `INSERT INTO "lists_payment_methods" ("list_id", "payment_method_id")
                VALUES (${list.dataValues.id}, ${payment_method_id})
                `,
            {
              type: QueryTypes.INSERT,
            }
          );
          // console.log(result1);
        }
      });
    }

    return successResponse(res, Messages.createdList, list);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// Read All lists
exports.getAllLists = async (req, res) => {
  try {
    const { type, amount, currency, payment_method, token, fiat_amount } =
      req.query;
    const filter = {};

    // Adding filters based on provided query parameters
    if (type) {
      filter.type = type;
    }
    if (amount) {
      filter.total_available_amount = { [Op.gte]: amount };
    }
    if (currency) {
      filter.fiat_currency_id = currency;
    }
    if (token) {
      filter.token_id = token;
    }

    if (fiat_amount) {
      filter[Op.or] = [
        {
          [Op.and]: [
            { limit_min: { [Op.gte]: fiat_amount } },
            { limit_max: { [Op.lte]: fiat_amount } },
          ],
        },
        {
          [Op.and]: [
            { limit_min: { [Op.is]: null } },
            { limit_max: { [Op.is]: null } },
          ],
        },
      ];
    }

    // console.log("filter-------------", filter);

    let page = req.query.page ? req.query.page : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : 20;
    const pageNumber = Math.max(parseInt(page), 1);
    const pageSizeNumber = Math.max(parseInt(pageSize), 1);
    const offset = (pageNumber - 1) * pageSizeNumber;
    const totalRecords = await models.lists.count({ where: filter });
    const totalPages = Math.ceil(totalRecords / 20);
    const listData = await models.lists.findAll({
      where: {
        ...filter,
        status: {
          [Op.eq]: 1,
        },
      },
      limit: pageSizeNumber,
      offset: offset,
      order: [["created_at", "DESC"]],
    });
    //console.log(listData); // Output the result
    let output = [];
    if (listData !== null) {
      for (const item of listData) {
        let bankIdsData = [];
        if (item.dataValues.type === "SellList") {
          const result = await fetchedListLoop(item);
          //  console.log("data", data);
          output.push(result);
        } else if (type === "BuyList") {
          const bankIds = await models.lists_banks.findAll({
            attributes: ["bank_id"],
            where: {
              list_id: item.dataValues.id,
            },
          });
          bankIds.forEach((record) => {
            let banks = record.dataValues.bank_id; // Extract data values from each record
            bankIdsData.push(banks);
          });
          const result = await fetchedListLoop(item, bankIdsData);

          //console.log("data", data);
          output.push(result);
          //return successResponse(res, Messages.getList, output);
        } else {
        }
      }
    } else {
      return errorResponse(res, httpCodes.badReq, Messages.noDataFound);
    }
    let results = {
      data: output,
      meta: {
        current_page: pageNumber,
        total_pages: totalPages,
        total_count: totalRecords,
      },
    };
    // console.log("output--------------------------", output);
    // console.log(successResponse(res, Messages.getList, output));
    return successResponse(res, Messages.getList, results);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// Get List by Id
exports.getList = async (req, res) => {
  const { id } = req.params;
  try {
    const list = await models.lists.findOne({
      where: {
        id: id,
        status: {
          [Op.notIn]: [0, 2], // Exclude status 0 and 2(Hidden and deleted status)
        },
      },
    });
    if (!list) {
      return errorResponse(res, httpCodes.badReq, Messages.listNotFound);
    }
    let bankIdsData = [];
    if (list.dataValues.type == "SellList") {
      const data = await fetchedListLoop(list);
      //  console.log("data", data);
      return successResponse(res, Messages.getList, data);
    } else {
      const bankIds = await models.lists_banks.findAll({
        attributes: ["bank_id"],
        where: {
          list_id: list.dataValues.id,
        },
      });
      bankIds.forEach((record) => {
        let banks = record.dataValues.bank_id; // Extract data values from each record
        bankIdsData.push(banks);
      });
      const data = await fetchedListLoop(list, bankIdsData);

      //   console.log("data", data);
      return successResponse(res, Messages.getList, data);
    }
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// method for updating the list
exports.updateList = async (req, res) => {
  const { id } = req.params;
  const list_id = id;
  const {
    chain_id,
    seller_id,
    token_id,
    fiat_currency_id,
    total_available_amount,
    limit_min,
    limit_max,
    margin_type,
    margin,
    terms,
    automatic_approval,
    status,
    payment_method_id,
    type,
    bank_id,
    deposit_time_limit,
    payment_time_limit,
    accept_only_verified,
    escrow_type,
    price_source,
    price,
    payment_methods,
  } = req.body;
  const { user } = req;

  try {

        // Validate price/margin based on margin_type
        if (margin_type === 1) { // Floating rate
          if (price !== null) {
            return errorResponse(res, httpCodes.badReq, "Price must be null for floating rate listings");
          }
          if (!margin) {
            return errorResponse(res, httpCodes.badReq, "Margin is required for floating rate listings");
          }
        } else { // Fixed rate
          if (!price) {
            return errorResponse(res, httpCodes.badReq, "Price is required for fixed rate listings");
          }
          if (margin !== null) {
            return errorResponse(res, httpCodes.badReq, "Margin must be null for fixed rate listings");
          }
        }


    const fetchedList = await models.lists.findByPk(id);
    if (!fetchedList) {
      return errorResponse(res, httpCodes.badReq, Messages.listNotFound);
    }
    (fetchedList.chain_id = chain_id),
      (fetchedList.seller_id = seller_id),
      (fetchedList.token_id = token_id),
      (fetchedList.fiat_currency_id = fiat_currency_id),
      (fetchedList.total_available_amount = total_available_amount),
      (fetchedList.limit_min = limit_min),
      (fetchedList.limit_max = limit_max),
      (fetchedList.margin_type = margin_type),
      (fetchedList.margin = margin),
      (fetchedList.terms = terms),
      (fetchedList.automatic_approval = automatic_approval),
      (fetchedList.status = status),
      (fetchedList.payment_method_id = payment_method_id),
      (fetchedList.type = type),
      (fetchedList.bank_id = bank_id),
      (fetchedList.deposit_time_limit = deposit_time_limit),
      (fetchedList.payment_time_limit = payment_time_limit),
      (fetchedList.accept_only_verified = accept_only_verified),
      (fetchedList.escrow_type = escrow_type),
      (fetchedList.price_source = price_source),
      (fetchedList.price = price);

    bankIds = req.body.bank_ids;

    if (type === "BuyList" && payment_methods.length > 0) {
      // Delete existing banks
      await models.lists_banks.destroy({
        where: {
          list_id: list_id,
        },
      });

      const newBanksData = payment_methods.map((data) => ({
        list_id: list_id,
        bank_id: data.bank.id,
      }));

      await sequelize
        .getQueryInterface()
        .bulkInsert("lists_banks", newBanksData);
    } else if (type === "SellList" && payment_methods.length > 0) {
      
      // First, get all existing payment method IDs for this list
      const existingPaymentMethodIds =
        await models.lists_payment_methods.findAll({
          where: {
            list_id: list_id,
          },
          attributes: ["list_id", "payment_method_id"],
        });

      const deletedValues = await models.lists_payment_methods.destroy({
        where: {
          payment_method_id: existingPaymentMethodIds.map(
            (data) => data.payment_method_id
          ),
          list_id: list_id,
        },
      });

      payment_methods.forEach(async (params) => {
        const result = await models.payment_methods.findOne({
          where: {
            user_id: user.id,
            bank_id: params.bank_id,
          },
        });

        let payment_method_id = 0;
        if (!result) {
          const payment_method_created = models.payment_methods.create({
            user_id: user.id,
            bank_id: params.bank_id,
            values: params.values,
            type: "ListPaymentMethod",
          });
          payment_method_id = payment_method_created.dataValues.id;
        } else {
          payment_method_id = result.dataValues.id;

          await models.payment_methods.update(
            {
              values: params.values,
            },
            {
              where: {
                user_id: user.id,
                bank_id: params.bank_id,
              },
            }
          );
        }

        const check_existence_in_list_payment_methods =
          await models.lists_payment_methods.findOne({
            where: {
              list_id: list_id,
              payment_method_id: payment_method_id,
            },
            attributes: ["list_id", "payment_method_id"],
          });

        if (!check_existence_in_list_payment_methods) {
          const result1 = await sequelize.query(
            `INSERT INTO "lists_payment_methods" ("list_id", "payment_method_id")
                VALUES (${list_id}, ${payment_method_id})
                `,
            {
              type: QueryTypes.INSERT,
            }
          );
          // console.log(result1);
        }
      });
    }

    let updatedList = await fetchedList.save();
    return successResponse(res, Messages.updatedList, updatedList);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// method for deleting the list using id as a parameter
exports.deleteList = async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  try {
    const fetchedList = await models.lists.findByPk(id);
    if (!fetchedList) {
      return errorResponse(res, httpCodes.badReq, Messages.listNotFound);
    }
    if (fetchedList.dataValues.seller_id == user.dataValues.id) {
      fetchedList.set("status", 2);
      await fetchedList.save();
      return successResponse(res, Messages.deletedSuccessfully);
    } else {
      return errorResponse(res, httpCodes.forbidden, Messages.NoAccess);
    }
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

//method for getting the count for the lists
module.exports.getListsCount = async (req, res) => {
  try {
    const count = await models.lists.count();
    return successResponse(res, Messages.success, count);
  } catch (error) {
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

async function fetchedListLoop(element, banksIds = null) {
  return new Promise(async (resolve) => {
    let banksData = [];
    if (banksIds) {
      for (let item of banksIds) {
        let particularBankData = await models.banks.findByPk(item);
        let data = particularBankData.dataValues;
        banksData.push(data);
      }
    }

    let fiatCurrencyData;
    if (
      element.dataValues.fiat_currency_id !== "" ||
      element.dataValues.fiat_currency_id !== null
    ) {
      fiatCurrencyData = await models.fiat_currencies.findByPk(
        element.dataValues.fiat_currency_id
      );
    }
    
    let tokenData;
    if (
      element.dataValues.token_id !== "" ||
      element.dataValues.token_id !== null
    ) {
      tokenData = await models.tokens.findByPk(element.dataValues.token_id);
    }

    let totalPaymentMethods = [];
    const paymentMethodsIds = await models.lists_payment_methods.findAll({
      attributes: ["payment_method_id"],
      where: {
        list_id: element.dataValues.id,
      },
    });

    if (
      element.dataValues.payment_method_id !== "" ||
      element.dataValues.payment_method_id !== null
    ) {
      for (let item of paymentMethodsIds) {
        let paymentMethodsData = await models.payment_methods.findAll({
          where: {
            id: item.dataValues.payment_method_id,
            user_id: element.dataValues.seller_id,
          },
        });
        for (let record of paymentMethodsData) {
          let paymentMethodData = record.dataValues;
          let particularBankData = await models.banks.findByPk(
            paymentMethodData.bank_id
          );
          paymentMethodData["bank"] = particularBankData;
          totalPaymentMethods.push(paymentMethodData);
        }
      }
    }

    let userData;
    if (
      element.dataValues.seller_id !== "" ||
      element.dataValues.seller_id !== null
    ) {
      userData = await models.user.findByPk(element.dataValues.seller_id);
      if(!userData){
        console.log("User not found for ", element.dataValues.seller_id);
      }
      let contracts = await models.contracts.findAll({
        where: {
          user_id: element.dataValues.seller_id,
          chain_id: element.dataValues.chain_id,
        },
      });
      userData.dataValues["contracts"] = contracts;
      userData.dataValues["online"] = isOnline(
        userData.dataValues.timezone,
        userData.dataValues.available_from,
        userData.dataValues.available_to,
        userData.dataValues.weeekend_offline
      );
    }

    // Price calculation logic
    let calculatedPrice = null;
    let spotPrice = null;

    if (element.dataValues.margin_type === 0) {
      // Fixed rate - use stored price
      calculatedPrice = element.dataValues.price;
    } else {
      // Floating rate - calculate from spot price and margin
      const type = element.dataValues.type?.toUpperCase() || 'BUY';
      const cacheKey = `prices/${tokenData.dataValues.symbol}/${fiatCurrencyData.dataValues.code}/${type}`;
      const prices = cache.get(cacheKey);
      
      if (prices) {
        switch(element.dataValues.price_source) {
          case 2: // binance_min
            spotPrice = prices[0];
            break;
          case 3: // binance_max
            spotPrice = prices[2];
            break;
          case 1: // binance_median
            spotPrice = prices[1];
            break;
          case 0: // coingecko
          default:
            const coingeckoKey = `${tokenData.dataValues.coingecko_id}/${fiatCurrencyData.dataValues.code}`.toLowerCase();
            spotPrice = getCachedPrice(coingeckoKey);
        }

        if (spotPrice !== null) {
          const margin = parseFloat(element.dataValues.margin);
          calculatedPrice = spotPrice * (1 + margin/100);
        }
      } else {
        console.warn(`No cached price found for ${tokenData.dataValues.symbol}/${fiatCurrencyData.dataValues.code}`);
      }
    }

    let response = {
      id: element.dataValues.id,
      automatic_approval: element.dataValues.automatic_approval,
      chain_id: element.dataValues.chain_id,
      limit_min: element.dataValues.limit_min,
      limit_max: element.dataValues.limit_max,
      price: calculatedPrice,
      margin_type: element.dataValues.margin_type,
      margin: element.dataValues.margin_type === 1 ? element.dataValues.margin : null,
      status: element.dataValues.status,
      terms: element.dataValues.terms,
      token: element.dataValues.token_id,
      bank: banksData,
      total_available_amount: element.dataValues.total_available_amount,
      type: element.dataValues.type,
      deposit_time_limit: element.dataValues.deposit_time_limit,
      payment_time_limit: element.dataValues.payment_time_limit,
      accept_only_verified: element.dataValues.accept_only_verified,
      escrow_type: element.dataValues.escrow_type == 0 ? "manual" : "instant",
      price_source: priceSourceMethod.priceSourceFunction(
        element.dataValues.price_source
      ),
      token_spot_price: spotPrice,
      fiat_currency: fiatCurrencyData,
      token: tokenData,
      payment_methods: totalPaymentMethods,
      seller: userData,
    };

    resolve(response);
  });
}

exports.fetchListForParticularUser = async (req, res) => {
  const { seller } = req.query;
  try {
    // console.log("userId", seller);
    let page = req.params.page ? req.params.page : 1;
    let pageSize = req.params.pageSize ? req.params.pageSize : 10;
    const pageNumber = Math.max(parseInt(page), 1);
    const pageSizeNumber = Math.max(parseInt(pageSize), 1);
    const offset = (pageNumber - 1) * pageSizeNumber;
    const user = await models.user.findOne({
      where: {
        address: seller,
      },
    });
    //console.log("user",user)
    const listData = await models.lists.findAll({
      limit: pageSizeNumber,
      offset: offset,
      order: [["created_at", "DESC"]],
      where: {
        seller_id: user.dataValues.id,
        status: 1,
      },
    });
    //console.log("listData", listData);
    let output = [];
    if (listData !== null) {
      for (const item of listData) {
        let bankIdsData = [];
        if (item.dataValues.type == "SellList") {
          const result = await fetchedListLoop(item);
          //  console.log("data", data);
          output.push(result);
        } else {
          const bankIds = await models.lists_banks.findAll({
            attributes: ["bank_id"],
            where: {
              list_id: item.dataValues.id,
            },
          });
          bankIds.forEach((record) => {
            let banks = record.dataValues.bank_id; // Extract data values from each record
            bankIdsData.push(banks);
          });
          const result = await fetchedListLoop(item, bankIdsData);

          //console.log("data", data);
          output.push(result);
        }
      }
    } else {
      return errorResponse(res, httpCodes.badReq, Messages.noDataFound);
    }
    return successResponse(res, Messages.getList, output);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

exports.testListController = async (req, res) => {
  try {
    const [results, metadata] = await sequelize.query(
      `
      SELECT 
        lists.*, 
        users.*, 
        tokens.*, 
        fiat_currencies.*, 
        payment_methods.*, 
        banks.*
      FROM lists
      LEFT JOIN users ON lists.seller_id = users.id
      LEFT JOIN tokens ON lists.token_id = tokens.id
      LEFT JOIN fiat_currencies ON lists.fiat_currency_id = fiat_currencies.id 
      LEFT JOIN payment_methods ON lists.payment_method_id = payment_methods.id
      LEFT JOIN banks ON payment_methods.bank_id = banks.id
      where lists.id = 3265;
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );
    // console.log("result", results);
    res.json({
      data: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.fetchMyAds = async (req, res) => {
  console.log("here in my ads");
  const { user } = req;
  try {
    let page = req.query.page ? req.query.page : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : 20;
    const pageNumber = Math.max(parseInt(page), 1);
    const pageSizeNumber = Math.max(parseInt(pageSize), 1);
    const offset = (pageNumber - 1) * pageSizeNumber;
    const userData = await models.user.findOne({
      where: {
        address: user.address,
      },
      limit: pageSizeNumber,
      offset: offset,
      order: [["created_at", "DESC"]],
    });
    //console.log("user",user)
    const listData = await models.lists.findAll({
      limit: pageSizeNumber,
      offset: offset,
      order: [["created_at", "DESC"]],
      where: {
        seller_id: userData.dataValues.id,
        status: {
          [Op.ne]: 2,
        },
      },
    });
    //console.log("listData", listData);
    let output = [];
    if (listData !== null) {
      for (const item of listData) {
        let bankIdsData = [];
        if (item.dataValues.type == "SellList") {
          const result = await fetchedListLoop(item);
          //  console.log("data", data);
          output.push(result);
        } else {
          const bankIds = await models.lists_banks.findAll({
            attributes: ["bank_id"],
            where: {
              list_id: item.dataValues.id,
            },
          });
          bankIds.forEach((record) => {
            let banks = record.dataValues.bank_id; // Extract data values from each record
            bankIdsData.push(banks);
          });
          const result = await fetchedListLoop(item, bankIdsData);

          //console.log("data", data);
          output.push(result);
        }
      }
    } else {
      return errorResponse(res, httpCodes.badReq, Messages.noDataFound);
    }
    return successResponse(res, Messages.getList, output);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};
