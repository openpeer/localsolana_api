require('dotenv').config();
const models = require('../models/index'); // Adjusted the path to the models directory
const NotificationWorker = require('../workers/notificationWorker');

async function createTestEntities() {
  const seller = await models.user.findByPk(1); // Use user with id 1
  const buyer = await models.user.findByPk(1); // Use user with id 1

  const token = await models.tokens.findOne();
  const fiatCurrency = await models.fiat_currencies.findOne();

  const paymentMethod = await models.payment_methods.create({
    user_id: seller.id,
    bank_id: (await models.banks.findOne()).id,
    values: { "upi_id": "test123@upi" },
    type: 'ListPaymentMethod' // Provide a value for the type field
  });

  const list = await models.lists.create({
    seller_id: seller.id,
    token_id: token.id,
    fiat_currency_id: fiatCurrency.id,
    chain_id: token.chain_id,
    payment_time_limit: 60,
    margin: 0.01,
    margin_type: 0, // Assuming 0 is for fixed
    payment_method_id: paymentMethod.id,
    escrow_type: 1 // Assuming 1 is for instant
  });

  const order = await models.Order.create({
    list_id: list.id,
    buyer_id: buyer.id,
    seller_id: seller.id,
    fiat_amount: 100,
    token_amount: 1,
    status: 0, // Assuming 0 is for created
    chain_id: list.chain_id,
    payment_method_id: (await models.payment_methods.create({
      user_id: buyer.id,
      bank_id: (await models.banks.findOne()).id,
      values: { "upi_id": "buyer123@upi" },
      type: 'OrderPaymentMethod' // Provide a value for the type field
    })).id
  });

  return order;
}

async function testNotifications() {
  const order = await createTestEntities();

  const notificationTypes = [
    NotificationWorker.NEW_ORDER,
    NotificationWorker.SELLER_ESCROWED,
    NotificationWorker.BUYER_PAID,
    NotificationWorker.SELLER_RELEASED,
    NotificationWorker.ORDER_CANCELLED,
    NotificationWorker.DISPUTE_OPENED,
    NotificationWorker.DISPUTE_RESOLVED
  ];

  for (const type of notificationTypes) {
    console.log(`Testing notification: ${type}`);
    await new NotificationWorker().perform(type, order.id);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between notifications
  }

  console.log("All notifications tested!");
}

testNotifications().catch(error => {
  console.error("Error testing notifications:", error);
});