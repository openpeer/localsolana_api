const bcrypt = require('bcryptjs');
const models = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
const testDbConnection = require('../config/database');

// method for creating the dispute
exports.createDispute = async function (req, res, io) {
  const { winner_id, resolved } = req.body;
  const { id } = req.params;
  try {
    const fetchedOrder = await models.Order.findByPk(id);
    if (!fetchedOrder) {
      return errorResponse(res, httpCodes.badReq, Messages.orderNotFound)
    }
    let dataForDispute = {
      order_id: fetchedOrder.id,
      winner_id,
      resolved,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    console.log("dataForDispute", dataForDispute);
    const data = await models.Dispute.create(dataForDispute);
    if (data) {
      if (disputeData) {
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
        return successResponse(res, Messages.success, data);
      }
    }
  } catch (error) {
    console.log("error", error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
}

// Get all disputes
exports.getAllDisputes = async (req, res) => {
  try {
    console.log("models", models);
    const disputesFetched = await models.Dispute.findAll();
    return successResponse(res, Messages.success, disputesFetched);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// Read particular Dispute by ID
exports.getParticularDispute = async (req, res) => {
  const { id } = req.params;
  try {
    const disputeFetched = await models.Dispute.findByPk(id);
    if (!disputeFetched) {
      return errorResponse(res, httpCodes.badReq, Messages.disputeNotFound);
    }
    return successResponse(res, Messages.success, disputeFetched);
  } catch (error) {
    console.error(error);
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
  const { id } = req.params;
  const { resolved } = req.body;
  try {
    const fetchedDispute = await models.Dispute.findByPk(id);
    if (!fetchedDispute) {
      return errorResponse(res, httpCodes.badReq, Messages.usernotFound);
    }
    fetchedDispute.resolved = resolved;
    await models.Dispute.save();
    return successResponse(res, Messages.disputeUpdated, fetchedDispute);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
}