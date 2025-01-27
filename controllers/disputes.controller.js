const bcrypt = require('bcryptjs');
const models = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
const testDbConnection = require('../config/database');
const { response } = require('express');
const { where } = require('sequelize');
const { logDisputeAction, logDisputeError, logDisputeQuery } = require('../utils/dispute-logger');

// method for creating the dispute
exports.createDispute = async function (req, res, io) {
  const { winner_id, resolved, comments, files } = req.body;
  const { id } = req.params;
  const { user } = req;

  logDisputeAction('Create Dispute Initiated', { orderId: id, userId: user.id });

  try {
    const fetchedOrder = await models.Order.findByPk(id);
    if (!fetchedOrder) {
      logDisputeError(new Error('Order not found'), { orderId: id });
      return errorResponse(res, httpCodes.badReq, Messages.orderNotFound)
    }

    const orderIdInDispute = await models.Dispute.findOne({ where: { order_id: id } });
    logDisputeAction('Check Existing Dispute', { 
      orderId: id, 
      existingDispute: orderIdInDispute ? true : false 
    });

    if (!orderIdInDispute) {
      let dataForDispute = {
        order_id: fetchedOrder.id,
        winner_id,
        resolved,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      logDisputeAction('Creating New Dispute', dataForDispute);

      const data = await models.Dispute.create(dataForDispute);
      if (data) {
        let UserDisputesObject = {
          dispute_id: data.dataValues.id,
          user_id: user.id,
          comments
        }
        const userDisputes = await models.user_disputes.create(UserDisputesObject);
        logDisputeAction('User Dispute Created', userDisputes.dataValues);

        // Broadcast the order update
        if (fetchedOrder.buyer_id) {
          const buyerChannel = `OrdersChannel_${fetchedOrder.id}_${fetchedOrder.buyer_id}`;
          io.to(buyerChannel).emit('orderUpdate', {
            message: 'Order details updated',
            order: fetchedOrder
          });
          logDisputeAction('Buyer Notification Sent', { channel: buyerChannel });
        }
        if (fetchedOrder.seller_id) {
          const sellerChannel = `OrdersChannel_${fetchedOrder.id}_${fetchedOrder.seller_id}`;
          io.to(sellerChannel).emit('orderUpdate', {
            message: 'Order details updated',
            order: fetchedOrder
          });
          logDisputeAction('Seller Notification Sent', { channel: sellerChannel });
        }

        if (files) {
          for (let item of files) {
            let data = {
              user_dispute_id: userDisputes.dataValues.id,
              filename: item
            }
            const fileEntry = await models.dispute_files.create(data);
            logDisputeAction('Dispute File Added', { 
              disputeId: userDisputes.dataValues.id, 
              filename: item 
            });
          }
        }

        let response = {
          "dispute": data.dataValues.id,
          "resolved": data.dataValues.resolved,
          "user_dispute": {
            "id": userDisputes.dataValues.id,
            "comments": userDisputes.dataValues.comments
          },
          "counterpart_replied": false,
          "winner": data.dataValues.winner_id
        }
        return successResponse(res, Messages.success, response);
      }
    }

    // Handle existing dispute
    let UserDisputesObject = {
      dispute_id: orderIdInDispute.dataValues.id,
      user_id: user.id,
      comments
    }
    const userDisputes = await models.user_disputes.create(UserDisputesObject);
    logDisputeAction('Added Response to Existing Dispute', userDisputes.dataValues);

    // Broadcast the order update
    if (fetchedOrder.buyer_id) {
      const buyerChannel = `OrdersChannel_${fetchedOrder.id}_${fetchedOrder.buyer_id}`;
      io.to(buyerChannel).emit('orderUpdate', {
        message: 'Order details updated',
        order: fetchedOrder
      });
    }
    if (fetchedOrder.seller_id) {
      const sellerChannel = `OrdersChannel_${fetchedOrder.id}_${fetchedOrder.seller_id}`;
      io.to(sellerChannel).emit('orderUpdate', {
        message: 'Order details updated',
        order: fetchedOrder
      });
    }

    if (files) {
      for (let item of files) {
        let data = {
          user_dispute_id: userDisputes.dataValues.id,
          filename: item
        }
        const fileEntry = await models.dispute_files.create(data);
      }
    }

    let response = {
      "dispute": orderIdInDispute.id,
      "resolved": orderIdInDispute.resolved,
      "user_dispute": {
        "id": userDisputes.dataValues.id,
        "comments": userDisputes.dataValues.comments
      },
      "counterpart_replied": false,
      "winner": orderIdInDispute.winner_id
    }
    return successResponse(res, Messages.success, response);
  } catch (error) {
    logDisputeError(error, { orderId: id, userId: user.id });
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
}

// Get all disputes
exports.getAllDisputes = async (req, res) => {
  logDisputeAction('Get All Disputes Request', { query: req.query });

  try {
    let totalDisputes = [];
    const disputesFetched = await models.Dispute.findAll({
      order: [['createdAt', 'DESC']],
    });
    logDisputeAction('Disputes Fetched', { count: disputesFetched.length });

    if (disputesFetched) {
      for (let item of disputesFetched) {
        const orderDetails = await models.Order.findOne({
          where: { id: item.order_id }
        });
        const buyerInformation = await models.user.findOne({
          where: { id: orderDetails.dataValues.buyer_id },
          attributes: ['id', 'name', 'address']
        });
        const sellerInformation = await models.user.findOne({
          where: { id: orderDetails.dataValues.seller_id },
          attributes: ['id', 'name', 'address']
        });
        
        item.dataValues['buyerInformation'] = buyerInformation;
        item.dataValues['sellerInformation'] = sellerInformation;
        totalDisputes.push(item);

        logDisputeAction('Dispute Details Assembled', {
          disputeId: item.id,
          orderId: item.order_id,
          buyerId: buyerInformation?.id,
          sellerId: sellerInformation?.id
        });
      }
    } else {
      logDisputeAction('No Disputes Found');
      return errorResponse(res, httpCodes.badReq, Messages.noDataFound);
    }
    return successResponse(res, Messages.success, totalDisputes);
  } catch (error) {
    logDisputeError(error, { query: req.query });
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// Read particular Dispute by ID
exports.getParticularDispute = async (req, res) => {
  const { id } = req.params;
  logDisputeAction('Get Particular Dispute Request', { disputeId: id });

  try {
    const disputeFetched = await models.Dispute.findOne({
      where: { order_id: id },
    });

    if (!disputeFetched) {
      logDisputeError(new Error('Dispute not found'), { orderId: id });
      return errorResponse(res, httpCodes.badReq, Messages.disputeNotFound);
    }

    const getUserDisputes = await models.user_disputes.findAll({
      where: { dispute_id: disputeFetched.id },
      include: [{
        model: models.dispute_files,
        as: 'files',
        attributes: ['filename'],
      }],
    });

    logDisputeAction('Dispute Details Retrieved', {
      disputeId: disputeFetched.id,
      userResponsesCount: getUserDisputes.length,
      filesCount: getUserDisputes.reduce((acc, curr) => acc + (curr.files?.length || 0), 0)
    });

    disputeFetched.setDataValue('user_responses', getUserDisputes);
    return successResponse(res, Messages.success, disputeFetched);
  } catch (error) {
    logDisputeError(error, { disputeId: id });
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// fetch the data by applying filters
exports.fetchDataByFiltersDispute = async (req, res) => {
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

exports.updateDispute = async (req, res) => {
  const updates = { ...req.body };
  logDisputeAction('Update Dispute Request', { updates });

  if (!updates?.order_id) {
    logDisputeError(new Error('Missing order_id'), { updates });
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }

  try {
    const fetchedDispute = await models.Dispute.findOne({
      where: { order_id: updates?.order_id }
    });

    if (!fetchedDispute) {
      logDisputeError(new Error('Dispute not found'), { orderId: updates.order_id });
      return errorResponse(res, httpCodes.badReq, Messages.usernotFound);
    }

    const result = await models.Dispute.update({ ...updates }, {
      where: { order_id: updates?.order_id }
    });
    logDisputeAction('Dispute Updated', { 
      orderId: updates.order_id,
      updates,
      result 
    });

    if (result) {
      await models.Order.update({
        status: 5
      }, {
        where: { id: updates?.order_id }
      });
      logDisputeAction('Order Status Updated', { 
        orderId: updates.order_id,
        newStatus: 5 
      });
    }

    const updatedResult = await models.Dispute.findOne({
      where: { order_id: updates?.order_id },
    });

    return successResponse(res, Messages.disputeUpdated, updatedResult);
  } catch (error) {
    logDisputeError(error, { updates });
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};