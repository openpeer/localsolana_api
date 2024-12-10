// controllers/lists/shared/payment-methods.js
const models = require('../../../models');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../../models');

exports.handleBuyListPaymentMethods = async (listId, paymentMethods) => {
  if (!paymentMethods || paymentMethods.length === 0) return;

  // Filter out any payment methods that would result in null bank_ids
  const validBanksData = paymentMethods
    .map((data) => {
      const bankId = data.bank_id || data.id || (data.bank && data.bank.id);
      if (!bankId) return null;
      return {
        list_id: listId,
        bank_id: bankId,
      };
    })
    .filter(item => item !== null);

  if (validBanksData.length > 0) {
    await sequelize.getQueryInterface().bulkInsert("lists_banks", validBanksData);
  }
};

exports.handleSellListPaymentMethods = async (listId, sellerId, paymentMethods) => {
  if (!paymentMethods || paymentMethods.length === 0) return;

  for (const params of paymentMethods) {
    const result = await models.payment_methods.findOne({
      where: {
        user_id: sellerId,
        bank_id: params.bank_id,
      },
    });

    let payment_method_id = 0;
    if (!result) {
      const payment_method_created = await models.payment_methods.create({
        user_id: sellerId,
        bank_id: params.bank_id,
        values: params.values,
        type: "ListPaymentMethod",
      });
      payment_method_id = payment_method_created.dataValues.id;
    } else {
      payment_method_id = result.dataValues.id;
      await models.payment_methods.update(
        { values: params.values },
        {
          where: {
            user_id: sellerId,
            bank_id: params.bank_id,
          },
        }
      );
    }

    const exists = await models.lists_payment_methods.findOne({
      where: {
        list_id: listId,
        payment_method_id: payment_method_id,
      },
      attributes: ["list_id", "payment_method_id"],
    });

    if (!exists) {
      await sequelize.query(
        `INSERT INTO "lists_payment_methods" ("list_id", "payment_method_id")
        VALUES (${listId}, ${payment_method_id})`,
        { type: QueryTypes.INSERT }
      );
    }
  }
};