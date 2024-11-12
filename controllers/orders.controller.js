const models = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
const cron = require('node-cron');
const moment = require('moment');
const testDbConnection = require('../config/database');

const { Op,Sequelize } = require('sequelize');
const { PublicKey } = require("@solana/web3.js");
const NotificationWorker = require("../workers/notificationWorker");
const getTradeId = function (orderID) {
  const [escrowPda_, escrowStateBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), Buffer.from(String(orderID))],
    new PublicKey("1w3ekpHrruiEJPYKpQH6rQssTRNKCKiqUjfQeJXTTrX")
  );
  return escrowPda_;
};

// Read All Orders
exports.getAllOrders = async (req, res) => {
  try {
    console.log("testing");
    let page = req.params.page ? req.params.page : 1;
    let pageSize = req.params.pageSize ? req.params.pageSize : 10
    const pageNumber = Math.max(parseInt(page), 1);
    const pageSizeNumber = Math.max(parseInt(pageSize), 1);
    const offset = (pageNumber - 1) * pageSizeNumber;

    const ordersFetched = await models.Order.findAll({
      limit: pageSizeNumber,
      offset: offset,
      order: [['created_at', 'DESC']] // Example ordering by creation date
    });
    for (const item of ordersFetched) {
      await fetchedOrderLoop(item);
    }
    const filteredTradeData = ordersFetched.filter(data => data.trade_id !== "" && data.trade_id !== null);
    // if the trade Id is null or empty then it will not be sent ot frontend
    return successResponse(res, Messages.success, filteredTradeData);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};


async function fetchedOrderLoop(item) {
  // console.log("item", item);
  return new Promise(async (resolve) => {
    const list = await models.lists.findByPk(item.dataValues.list_id);
    if (!list) {
      resolve(null);
    }
    const fiat_currency = await models.fiat_currencies.findByPk(list.dataValues.fiat_currency_id);
    list.dataValues['fiat_currency'] = fiat_currency;
    let tokenData;
    if (list.dataValues.token_id !== "" || list.dataValues.token_id !== null) {
      tokenData = await models.tokens.findByPk(list.dataValues.token_id);
    }
    list.dataValues['token'] = tokenData;
    // console.log("list", list);
    const buyer = await models.user.findByPk(item.dataValues.buyer_id);
    const seller = await models.user.findByPk(item.dataValues.seller_id);
    // console.log("seller", seller);
    const paymentMethod = await models.payment_methods.findByPk(item.dataValues.payment_method_id);
    if (paymentMethod) {
      const bank = await models.banks.findByPk(paymentMethod.dataValues.bank_id);
      paymentMethod.dataValues['bank'] = bank;
    }
    item.dataValues['list'] = list;
    item.dataValues['seller'] = seller;
    item.dataValues['buyer'] = buyer;
    item.dataValues['payment_method'] = paymentMethod;
    resolve(item);
  });
}


// Read particular Order by ID
exports.getParticularOrder = async (req, res) => {
  const { id } = req.params;
  const {user} = req;
  try {
    const orderFetched = await models.Order.findByPk(id);
    if (!orderFetched) {
      return errorResponse(res, httpCodes.badReq, Messages.orderNotFound);
    }
    const ordersFetched = await fetchedOrderLoop(orderFetched);

    if(ordersFetched){
      const disputeData = await models.Dispute.findAll({
        where: {
          order_id : ordersFetched.dataValues.id
        }
      });
      //console.log("disputeIds", disputeIds);
      // Extract the ids
      if(disputeData){
        const disputeIds = disputeData.map(dispute => dispute.id);
        // need to include checks for the arbirator
        const makeCondition=(user.address==='4uXATaUbYJjvRu1QfZVBDbhsa8XtDEvUUJWPKanHhsja' || (+ordersFetched.dataValues.status)===5)?{
            dispute_id: {
              [Op.in]: disputeIds
            }
          }
          :
          {
            user_id: user.id,
              dispute_id: {
                [Op.in]: disputeIds
              }
          };

        const userData = await models.user_disputes.findAll({
          where:makeCondition
        })

        let userDisputes = [];
        if(userData.length > 0){
          for(let dispute of disputeData){
            for(let user of userData){
              let userDisputeData = {
                "id": dispute.id,
                "resolved": dispute.resolved,
                "user_dispute" : {
                  "id": user.id,
                  "comments":user.comments
                },
                "counterpart_replied" : false,
                "winner" : dispute.winner_id

              }
              userDisputes.push(userDisputeData);
            }
          } 
        }
        
       console.log(userData.length,"userDisputes", userDisputes);
        ordersFetched.dataValues['dispute'] = userDisputes;
      }
    
    }
    //console.log("ordersFetched", ordersFetched);
    //const filteredTradeData = ordersFetched.filter(data => data.trade_id !== "" && data.trade_id !== null);
    return successResponse(res, Messages.success, ordersFetched);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

exports.fetchDataByFilters = async (req, res) => {
  try {
    // Example filters (can be received from query parameters or request body)
    const filters = {
      firstName: req.query.firstName, // Example: /users?firstName=John
      age: {
        [Op.gt]: req.query.age, // Example: /users?age=30
      },
    };

    // Construct the where clause based on provided filters
    const whereClause = {};
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        if (filters[key]) {
          if (typeof filters[key] === 'object' && !Array.isArray(filters[key])) {
            // Handle Sequelize operators for range queries, etc.
            whereClause[key] = filters[key];
          } else {
            // Direct equality match
            whereClause[key] = filters[key];
          }
        }
      }
    }

    // Fetch users based on the constructed where clause
    const users = await User.findAll({
      where: whereClause,
    });

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Error fetching users' });
  }
}

// CANCEL Order
exports.cancelOrder = async (req, res, io) => {
  const { id } = req.params;
  const { cancellation, other_reason } = req.body;
  const { user } = req;

  try {
    const order = await models.Order.findOne({
      where: { id },  // Assuming order belongs to the user
    });
    console.log("order", user);

    if (order.status == 0 || order.status == 1) {  // cancel only if we have status created or escrowed
      const [updated] = await models.Order.update(
        { status: 3, cancelled_by_id: user.dataValues.id, cancelled_at: Date.now() }, // cancel the order
        {
          where: { id: id }
        }
      );

      if (!updated) {
        return errorResponse(res, httpCodes.serverError, 'There is an error while cancelling Order');
      } else {
        // Log cancellation reasons if provided
        if (cancellation) {
          let reasons = [];
          Object.entries(cancellation).forEach(([key, value]) => {
            if (key === 'other' && other_reason) {
              reasons.push(other_reason);
            } else if (value) {
              reasons.push(key);
            }
          });

          if (reasons.length > 0) {
            for (let reason of reasons) {
              let object = {
                reason: reason,
                order_id: order.dataValues.id
              }
              let dataInserted = await models.cancellation_reasons.create(object);
              console.log("dataInserted", dataInserted);
            }
          }
        }
      }
    } else {
      return errorResponse(res, httpCodes.badReq, "Cancel order is not allowed");
    }

    const updatedOrder = await models.Order.findByPk(order.dataValues.id);
    if (order.dataValues.buyer_id) {
      const buyerChannel = `OrdersChannel_${order.id}_${order.dataValues.buyer_id}`;
      console.log(buyerChannel);

      io.to(buyerChannel).emit('orderUpdate', {
        message: 'Order details updated',
        order: order
      });
    }

    if (order.dataValues.seller_id) {
      const sellerChannel = `OrdersChannel_${order.id}_${order.dataValues.seller_id}`;
      io.to(sellerChannel).emit('orderUpdate', await fetchedOrderLoop(updatedOrder));
    }
    try{
    await  new NotificationWorker().perform(NotificationWorker.ORDER_CANCELLED,order.dataValues.id);
    }catch(e){
      console.log("Error in sending notification",e);
    }
    return successResponse(res, Messages.success, "Order has been cancelled");

  } catch (error) {
    console.error('Error canceling order:', error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// method for craeting new order
exports.createOrder = async function (req, res) {
  const { list_id, buyer_id, fiat_amount, token_amount, price, payment_method
  } = req.body;
  try {
    let user = await models.user.findOne({
      where: {
        address: buyer_id
      }
    })
    let list = await models.lists.findOne({
      where: {
        id: list_id
      }
    })
    let bankID = null;
    if (list.type == "SellList") {
      let paymentMethod = await models.payment_methods.findOne({
        where: {
          id: payment_method.id
        }
      })
      bankID = paymentMethod.bank_id;
    } else {
      bankID = payment_method.bank.id;
    }
    const payment_method_details=await models.payment_methods.findByPk(payment_method?.id);
    let paymentMethodData = {
      user_id: user.dataValues.id,
      bank_id: bankID,
      type: 'OrderPaymentMethod',
      values: (payment_method.values)?payment_method.values:payment_method_details?.values
    }
    const paymentMethod = await models.payment_methods.create(paymentMethodData);
    console.log("paymentMethod", paymentMethod);
    const createOrderObject = {
      list_id,
      buyer_id: list.type == "SellList"?user.dataValues.id:list.dataValues.seller_id,
      fiat_amount,
      status: 0,
      token_amount,
      price,
      uuid: "",
      cancelled_by_id: null,
      cancelled_at: null,
      trade_id: "",
      seller_id: list.type == "SellList"?list.dataValues.seller_id:user.dataValues.id,
      payment_method_id: paymentMethod.dataValues.id,
      deposit_time_limit: list.dataValues.deposit_time_limit,
      payment_time_limit: list.dataValues.payment_time_limit,
      chain_id: 1,
    };
    console.log("createOrderObject", createOrderObject);
    const data = await models.Order.create(createOrderObject);
    console.log("OrderID Generated", data.dataValues.id);

    // Step 2: Generate tradeID
    const tradeID = getTradeId(data.dataValues.id);

    // Step 3: Update the order with the generated tradeID
    await models.Order.update(
      { trade_id: tradeID.toBase58() },
      { where: { id: data.dataValues.id } }
    );
    await  new NotificationWorker().perform(NotificationWorker.NEW_ORDER,data.dataValues.id);
    return successResponse(res, Messages.success, data);
  } catch (error) {
    console.log(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
}

// Update Orders
exports.updateOrder = async (req, res, io) => {
  const { id } = req.query;
  const { status } = req.body;
  let updatedOrder; 
  try {
    const [affectedRows, [order]] = await models.Order.update(
      { status: status },
      {
        where: { id: id },
        returning: true // If you want to get the updated instance(s)
      }
    );
    updatedOrder = order;
    if (affectedRows === 0) { 
      console.log('No rows updated.');
      return errorResponse(res, httpCodes.serverError, 'There is an error while updating Order');
    } else {
      console.log('Update successful.');
      console.log(updatedOrder);
      
      // Emit events to the channels for buyer and seller
      //if (updatedOrder.buyer_id) {
        const buyerChannel = `OrdersChannel_${updatedOrder.id}_${updatedOrder.buyer_id}`;
        const sellerChannel = `OrdersChannel_${updatedOrder.id}_${updatedOrder.seller_id}`; 

        console.log(buyerChannel);
        const updatedOrderDetails = await models.Order.findByPk(order.dataValues.id);
        io.to(buyerChannel).emit('orderUpdate', await fetchedOrderLoop(updatedOrderDetails));
        io.to(sellerChannel).emit('orderUpdate', await fetchedOrderLoop(updatedOrderDetails));

      return successResponse(res, Messages.orderUpdated, []);
    }
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

exports.updateOrderSilently = async (id, status, io) => {

  let updatedOrder;
  try {
    const [affectedRows, [order]] = await models.Order.update(
      { status: status },
      {
        where: { id: id },
        returning: true // If you want to get the updated instance(s)
      }
    );
    updatedOrder = order;
    if (affectedRows === 0) {
      console.log('No rows updated.');
      return errorResponse(res, httpCodes.serverError, 'There is an error while updating Order');
    } else {
      console.log('Update successful.');
      console.log(updatedOrder);

      // Emit events to the channels for buyer and seller
      //if (updatedOrder.buyer_id) {
        const buyerChannel = `OrdersChannel_${updatedOrder.id}_${updatedOrder.buyer_id}`;
        const sellerChannel = `OrdersChannel_${updatedOrder.id}_${updatedOrder.seller_id}`;

        console.log(buyerChannel);
        const updatedOrderDetails = await models.Order.findByPk(order.dataValues.id);
        io.to(buyerChannel).emit('orderUpdate', await fetchedOrderLoop(updatedOrderDetails));
        io.to(sellerChannel).emit('orderUpdate', await fetchedOrderLoop(updatedOrderDetails));
    }
  } catch (error) {
    console.error(error);
  }
};

exports.updateTrade = async (req, res) => {
  try {
    const { id } = req.query;
    const { trade_id } = req.body;
    const [affectedRows] = await models.Order.update(
      { trade_id: trade_id },
      {
        where: { id: id },
        returning: true
      }
    );
    if (affectedRows === 0) {
      console.log('No rows updated.');
      return errorResponse(res, httpCodes.serverError, 'There is an error while updating Order');
    } else {
      console.log('Update successful.');
      return successResponse(res, Messages.orderUpdated, []);
    }
  } catch (error) {
    console.log(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);

  }
}

exports.fetchDatathroughStatus = async (req, res) => {
  try {
    console.log("testing");
    // console.log(req.query);
    const { status } = req.query;
    const statusArray = Array.isArray(status) ? status : [status];

    // Mapping of status strings to numeric values
    const statusMapping = {
      created: 0,
      escrowed: 1,
      release: 2,
      cancelled: 3,
      dispute: 4,
      closed: 5,
    };
    const statusNumberArray = statusArray.map(status => statusMapping[status]);
    let page = req.params.page ? req.params.page : 1;
    let pageSize = req.params.pageSize ? req.params.pageSize : 10;
    const pageNumber = Math.max(parseInt(page), 1);
    const pageSizeNumber = Math.max(parseInt(pageSize), 1);
    const offset = (pageNumber - 1) * pageSizeNumber;
    const { user } = req;
    const conditions = {
      [Op.or]: [{ buyer_id: user.id }, { seller_id: user.id }],
      status: {
        [Op.in]: statusNumberArray
      }
    };

    if (user.seller_id) {
      conditions.seller_id = seller_id;
    }
    const ordersFetched = await models.Order.findAll({
      limit: pageSizeNumber,
      offset: offset,
      where: conditions,
      order: [["created_at", "DESC"]], // Example ordering by creation date
    });

    const output = [];
    for (const item of ordersFetched) {
      let data = await fetchedOrderLoop(item);
      let fetchedData = data.dataValues;
      output.push(fetchedData);
    }
    console.log("output", output);
    //const filteredTradeData = ordersFetched.filter(data => data.trade_id !== "" && data.trade_id !== null);
    // if the trade Id is null or empty then it will not be sent ot frontend
    return successResponse(res, Messages.success, output);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

const executeTask = async () => {
  const orderDetails = await models.order.findByPk(id);
  console.log("orderDetails", orderDetails)
  console.log('Task executed at:', new Date().toLocaleString());
  // Add your task logic here
};

const scheduleOnceAfterAnHour = () => {
  // Schedule for 1 hour later
  const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
  const cronExpression = `${oneHourLater.getMinutes()} ${oneHourLater.getHours()} * * *`;

  console.log(`Cron job scheduled to run at: ${oneHourLater.toLocaleString()}`);
  
  // Schedule the cron job
  cron.schedule(cronExpression, () => {
    executeTask();
    // Cancel the job after execution
    this.stop();
  });
};

exports.testingCronJob = async(req, res) => {
  scheduleOnceAfterAnHour();
}

// Method for adding the transaction

exports.handleTransaction = async(req, res) => {
  try {
    const {order_id, tx_hash} = req.body;
    const { user } = req;
    const orderDetails = await models.Order.findByPk(order_id);
    console.log("orderDetails", orderDetails);
    if(orderDetails == null){
      return errorResponse(res, httpCodes.badReq, 'No order found');
    }
    console.log("orderDetails", orderDetails);
    console.log("user", user);
    if(orderDetails.dataValues.seller_id == user.id || orderDetails.dataValues.buyer_id == user.id){
      const payload = {
        order_id, 
        tx_hash
      }
      const transactionDetails = await models.transactions.create(payload);
      console.log("transactionDetails", transactionDetails);
      return successResponse(res, Messages.success, transactionDetails);

    }else{
      return errorResponse(res, httpCodes.unauthorized, "You're not authorized to perform this action.");
    }
  } catch (error) {
    console.log(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
}


