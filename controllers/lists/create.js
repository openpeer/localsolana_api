// controllers/lists/create.js
const models = require('../../models');
const { errorResponse, successResponse } = require('../../utils/rest');
const Messages = require('../../utils/messages');
const httpCodes = require('../../utils/httpCodes');
const { 
  validateListPrice,
  handleBuyListPaymentMethods,
  handleSellListPaymentMethods 
} = require('./shared');

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
    const priceValidation = validateListPrice(margin_type, price, margin);
    if (!priceValidation.isValid) {
      return errorResponse(res, httpCodes.badReq, priceValidation.error);
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

    if (type === "BuyList") {
      await handleBuyListPaymentMethods(list.dataValues.id, payment_methods);
    } else if (type === "SellList") {
      await handleSellListPaymentMethods(list.dataValues.id, seller_id, payment_methods);
    }

    return successResponse(res, Messages.createdList, list);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};