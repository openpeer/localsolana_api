const models   = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');

exports.paymentMethods =  async (req, res) => {
    try {
        // Logic to fetch payment methods
        const paymentMethods = await models.payment_methods.findAll({
          include: [{
            model: banks,
            include: [{
              model: fiat_currencies,
              where: {
                fiat_currency_id: [req.params.currency_id, null]
              }
            }]
          }]
        });
    return successResponse(res, Messages.success, paymentMethods);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
}

  // Read Payment methods from user id
  exports.getPaymentMethods =  async (req, res) => {
    const { id } = req.params;
    try {
      let paymentMethods = await models.payment_methods.findOne({
        where: {
          user_id: id
        }
      });
      if (!paymentMethods) {
        return errorResponse(res, httpCodes.badReq,Messages.noPaymentMethods);
      }
      console.log("getPaymentMethods", paymentMethods);
      return successResponse(res, Messages.paymentMethods, paymentMethods);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };