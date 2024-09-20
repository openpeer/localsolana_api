const bcrypt = require('bcryptjs');
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
const { where } = require('sequelize');
const { Op } = require('sequelize');


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
  try {
    const orderFetched = await models.Order.findByPk(id);
    if (!orderFetched) {
      return errorResponse(res, httpCodes.badReq, Messages.orderNotFound);
    }
    const ordersFetched = await fetchedOrderLoop(orderFetched);
    console.log(ordersFetched);
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
    console.log("order", order.dataValues.status);
    // if (!order || order.dataValues.status != 1) {
    //   return errorResponse(res, httpCodes.forbidden, Messages.orderCanceled);
    // }
    if (order.status == 0 || order.status == 1) {  // cancel only if we have status created or escrowed
      const [updated] = await models.Order.update(
        { status: 3, cancelled_by_id: user.id, cancelled_at: Date.now() }, // cancel the order
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
            return successResponse(res, Messages.success, "Order has been cancelled");
          }
        }
      }
    } else {
      return errorResponse(res, httpCodes.badReq, "Cancel order is not allowed");
    }
    // Broadcast the cancellation (assume there's a method to handle this)
    //await order.broadcast();

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
      console.log(sellerChannel);
      io.to(sellerChannel).emit('orderUpdate', {
        message: 'Order details updated',
        order: order
      });
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
  console.log("list_id, buyer_id, fiat_amount, token_amount, price, payment_method", list_id, buyer_id, fiat_amount, token_amount, price, payment_method);
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
    let paymentMethodData = {
      user_id: user.dataValues.id,
      bank_id: bankID,
      type: 'OrderPaymentMethod',
      values: payment_method.values
    }
    const paymentMethod = await models.payment_methods.create(paymentMethodData);
    console.log("paymentMethod", paymentMethod);
    const createOrderObject = {
      list_id, buyer_id: user.dataValues.id, fiat_amount, status: 0, token_amount, price, uuid: "",
      cancelled_by_id: null, cancelled_at: null, trade_id: "", seller_id: list.dataValues.seller_id, payment_method_id: paymentMethod.dataValues.id, deposit_time_limit: list.dataValues.deposit_time_limit, payment_time_limit: list.dataValues.payment_time_limit, chain_id: 1
    }
    console.log("createOrderObject", createOrderObject);
    const data = await models.Order.create(createOrderObject);
    console.log("Data", data);
    return successResponse(res, Messages.success, data);
  } catch (error) {
    console.log(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
}

// Update Orders
exports.updateOrder = async (req, res, io) => {
  const { id } = req.query;
  console.log("req.body", req.body);
  const { status } = req.body;
  //const {list_id, buyer_id, fiat_amount, token_amount, price, payment_method, status, uuid , cancelled_by_id} = req.body;
  try {
    const [affectedRows, [updatedOrder]] = await models.Order.update(
      { status: status },
      {
        where: { id: id },
        returning: true // If you want to get the updated instance(s)
      }
    );

    if (affectedRows === 0) {
      console.log('No rows updated.');
      return errorResponse(res, httpCodes.serverError, 'There is an error while updating Order');
    } else {
      console.log('Update successful.');
      console.log(updatedOrder);
      
      // Emit events to the channels for buyer and seller
      if (updatedOrder.buyer_id) {
        const buyerChannel = `OrdersChannel_${updatedOrder.id}_${updatedOrder.buyer_id}`;
        console.log(buyerChannel);
        io.to(buyerChannel).emit('orderUpdate', {
          message: 'Order details updated',
          order: updatedOrder
        });
      }

      if (updatedOrder.seller_id) {
        const sellerChannel = `OrdersChannel_${updatedOrder.id}_${updatedOrder.seller_id}`;
        console.log(sellerChannel);
        io.to(sellerChannel).emit('orderUpdate', {
          message: 'Order details updated',
          order: updatedOrder
        });
      }
      return successResponse(res, Messages.orderUpdated, []);
    }

    // const order = await models.Order.findByPk(id);
    // if (!order) {
    //   return errorResponse(res, httpCodes.badReq,Messages.orderNotFound);
    // }
    // let user = await models.user.findOne({
    //   where: {
    //     address: buyer_id
    //   }
    // })
    // let list = await models.lists.findOne({
    //   where: {
    //     id: list_id
    //   }
    // })
    // order.list_id =list_id,
    // order.buyer_id = user.dataValues.id,
    // order.fiat_amount=fiat_amount,
    // order.status=status,
    // order.token_amount=token_amount,
    // order.price = price,
    // order.uuid=uuid,
    // order.cancelled_by_id = cancelled_by_id,
    // order.cancelled_at=Date.now(),
    // order.seller_id = user.dataValues.id,
    // order.payment_method_id = paymentMethod.dataValues.id,
    // order.payment_time_limit = list.dataValues.payment_time_limit,
    // order.deposit_time_limit = list.dataValues.deposit_time_limit,
    // order.chain_id = payment_method .chain_id,
    // order.trade_id
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
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
    let page = req.params.page ? req.params.page : 1;
    let pageSize = req.params.pageSize ? req.params.pageSize : 10
    const pageNumber = Math.max(parseInt(page), 1);
    const pageSizeNumber = Math.max(parseInt(pageSize), 1);
    const offset = (pageNumber - 1) * pageSizeNumber;
    const { user } = req;
    const conditions = {
      [Op.or]: [
        { buyer_id: user.id },
        { seller_id: user.id }
      ]
    };

    if (user.seller_id) {
      conditions.seller_id = seller_id;
    }
    const ordersFetched = await models.Order.findAll({
      limit: pageSizeNumber,
      offset: offset,
      where: conditions,
      order: [['created_at', 'DESC']] // Example ordering by creation date
    });

    const output = [];
    for (const item of ordersFetched) {
      let data = await fetchedOrderLoop(item);
      let fetchedData = data.dataValues;
      for (let queryStatus of status) {
        if (queryStatus === 'escrowed') {
          if (queryStatus == 1) {
            output.push(fetchedData);
          }
        } else if (queryStatus === 'release') {
          if (fetchedData.status == 2) {
            output.push(fetchedData);
          }
        } else if (queryStatus === 'dispute') {
          if (fetchedData.status == 4) {
            output.push(fetchedData);
          }
        } else if (queryStatus === 'created') {
          if (fetchedData.status == 0) {
            output.push(fetchedData);
          }
        } else if (queryStatus === 'closed') {
          if (fetchedData.status == 5) {
            output.push(fetchedData);
          }
        } else if (queryStatus === 'cancelled') {
          if (fetchedData.status == 3) {
            output.push(fetchedData);
          }
        }
      }
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

