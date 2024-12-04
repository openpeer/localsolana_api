const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');
const { errorResponse, successResponse } = require('../../utils/rest');
const Messages = require('../../utils/messages');
const httpCodes = require('../../utils/httpCodes');

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
        type: QueryTypes.SELECT,
      }
    );

    return successResponse(res, Messages.success, results);
  } catch (error) {
    console.error('Error in test list controller:', error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
}; 