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
    // Check if user is authenticated
    if (!req.user) {
      return errorResponse(res, httpCodes.unauthorized, "User not authenticated");
    }

    const priceValidation = validateListPrice(margin_type, price, margin);
    if (!priceValidation.isValid) {
      return errorResponse(res, httpCodes.badReq, priceValidation.error);
    }

    const defaultChainId = 1;
    
    const list = await models.lists.create({
      chain_id: chain_id || defaultChainId,
      seller_id: req.user.id,
      token_id,
      fiat_currency_id,
      total_available_amount,
      limit_min,
      limit_max,
      margin_type,
      margin: margin_type === 0 ? 0 : margin, // Set margin to 0 for fixed rate
      terms,
      automatic_approval,
      status: 1,  // Always set status to 1 for new lists
      payment_method_id,
      type,
      bank_id,
      deposit_time_limit,
      payment_time_limit,
      accept_only_verified,
      escrow_type: escrow_type || 0,  // Explicitly set default to manual (0)
      price_source,
      price,
    });

    if (type === "BuyList" && payment_methods?.length > 0) {
      await handleBuyListPaymentMethods(list.dataValues.id, payment_methods);
    } else if (type === "SellList" && payment_methods?.length > 0) {
      await handleSellListPaymentMethods(list.dataValues.id, req.user.id, payment_methods);
      console.log('Payment methods being saved:', payment_methods);
    }

    return successResponse(res, Messages.createdList, list);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};