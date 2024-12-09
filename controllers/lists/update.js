// controllers/lists/update.js
const models = require('../../models');
const { errorResponse, successResponse } = require('../../utils/rest');
const Messages = require('../../utils/messages');
const httpCodes = require('../../utils/httpCodes');
const { 
  validateListPrice,
  handleBuyListPaymentMethods,
  handleSellListPaymentMethods 
} = require('./shared');

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
  let { margin } = req.body;
  const { user } = req;

  try {
    const priceValidation = validateListPrice(margin_type, price, margin);
    if (!priceValidation.isValid) {
      return errorResponse(res, httpCodes.badReq, priceValidation.error);
    }

    const fetchedList = await models.lists.findByPk(id);
    if (!fetchedList) {
      return errorResponse(res, httpCodes.badReq, Messages.listNotFound);
    }

    if (margin_type === 0) { // Fixed rate
      margin = 0;
    }

    // Add this before Object.assign
    console.log('Update payload:', {
      total_available_amount,
      type: typeof total_available_amount
    });

    // Update list fields
    Object.assign(fetchedList, {
      chain_id,
      seller_id,
      token_id,
      fiat_currency_id,
      total_available_amount,
      limit_min: limit_min === '' ? null : limit_min,
      limit_max: limit_max === '' ? null : limit_max,
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
      price
    });

    if (type === "BuyList" && payment_methods.length > 0) {
      // Delete existing banks
      await models.lists_banks.destroy({
        where: { list_id }
      });
      await handleBuyListPaymentMethods(list_id, payment_methods);
    } else if (type === "SellList" && payment_methods.length > 0) {
      // Get and delete existing payment methods
      const existingPaymentMethodIds = await models.lists_payment_methods.findAll({
        where: { list_id },
        attributes: ["payment_method_id"]
      });

      await models.lists_payment_methods.destroy({
        where: {
          payment_method_id: existingPaymentMethodIds.map(data => data.payment_method_id),
          list_id
        }
      });

      await handleSellListPaymentMethods(list_id, user.id, payment_methods);
    }

    const updatedList = await fetchedList.save();

    // And after
    console.log('List after update:', fetchedList.dataValues);

    return successResponse(res, Messages.updatedList, updatedList);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};