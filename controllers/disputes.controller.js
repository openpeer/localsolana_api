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

// method for creating the dispute
exports.createDispute = async function (req, res, io) {
  const { winner_id, resolved,comments, files } = req.body;
  const { id } = req.params;
  const {user} = req;
  try {
    const fetchedOrder = await models.Order.findByPk(id);
    if (!fetchedOrder) {
      return errorResponse(res, httpCodes.badReq, Messages.orderNotFound)
    }
    const orderIdInDispute = await models.Dispute.findOne({where : { order_id: id }});
    console.log("orderIdInDispute", orderIdInDispute)
    if(!orderIdInDispute){
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
        let UserDisputesObject = {
          dispute_id : data.dataValues.id,
          user_id: user.id,
          comments
        }
        const userDisputes = await models.user_disputes.create(UserDisputesObject);
        console.log("userDisputes", userDisputes);
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
        if(files){
          for(let item of files){
            let data = {
              user_dispute_id : userDisputes.dataValues.id,
              filename: item
            }
            const fileEntry = await models.dispute_files.create(data);
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
    }else{
      console.log("orderIdInDispute.dataValues.id", orderIdInDispute.dataValues.id);
        let UserDisputesObject = {
          dispute_id : orderIdInDispute.dataValues.id,
          user_id: user.id,
          comments
        }
        const userDisputes = await models.user_disputes.create(UserDisputesObject);
        console.log("userDisputes", userDisputes);
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

        if(files){
          for(let item of files){
            let data = {
              user_dispute_id : userDisputes.dataValues.id,
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
    let totalDisputes = [];
    const disputesFetched = await models.Dispute.findAll({
      order: [['createdAt', 'DESC']],
    });
    if(disputesFetched){
      for(let item of disputesFetched){
        const orderDetails = await models.Order.findOne({
          where: {
            id: item.order_id
          }
        });
        const buyerInformation = await models.user.findOne({
          where: {
            id: orderDetails.dataValues.buyer_id,
          },
          attributes: ['id', 'name', 'address']          
        });
        const sellerInformation = await models.user.findOne({
          where: {
            id: orderDetails.dataValues.seller_id
          },
          attributes: ['id', 'name', 'address']
        });
        item.dataValues['buyerInformation'] = buyerInformation;
        item.dataValues['sellerInformation'] = sellerInformation;
        console.log("-------item", item);
        totalDisputes.push(item);
      }
    }else{
      return errorResponse(res, httpCodes.badReq, Messages.noDataFound); 
    }
    return successResponse(res, Messages.success, totalDisputes);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// Read particular Dispute by ID
exports.getParticularDispute = async (req, res) => {
  const { id } = req.params;
  try {
    // const disputeFetched = await models.Dispute.findByPk(id);
    const disputeFetched = await models.Dispute.findOne({
      where: {
        order_id: id,
      },
    });

    if (!disputeFetched) {
      return errorResponse(res, httpCodes.badReq, Messages.disputeNotFound);
    }

    const getUserDisputes = await models.user_disputes.findAll({
      where:{
        dispute_id:disputeFetched.id
      },
      include: [{
        model: models.dispute_files,
        as: 'files',
        attributes: ['filename'], // Only fetches the filename attribute from dispute_files
      }],
    });

    // console.log("Hello ",getUserDisputes);
    // getUserDisputes.forEach(dispute => {
    //   console.log(`Dispute ID: ${dispute.dispute_id}`);
    //   dispute.files.forEach(file => {
    //     console.log(`Filename: ${file.filename}`);
    //   });
    // });
    disputeFetched.setDataValue('user_responses', getUserDisputes);

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
  const updates = {...req.body};

  if(!updates?.order_id) return errorResponse(res, httpCodes.serverError, Messages.systemError);
  
  try {
    const fetchedDispute = await models.Dispute.findOne({
      where:{
        order_id:updates?.order_id
      }
    });

    if (!fetchedDispute) {
      return errorResponse(res, httpCodes.badReq, Messages.usernotFound);
    }
    // fetchedDispute.resolved = resolved;
    // await models.Dispute.save();
    const result=await models.Dispute.update({...updates},{
      where:{
        order_id:updates?.order_id
      }
    })

    if(result){
      await models.Order.update({
        status:5
      },
      {
        where:{
          id:updates?.order_id
        }
      })
    }

    const updatedResult = await models.Dispute.findOne({
      where: {
        order_id: updates?.order_id,
      },
    });

    return successResponse(res, Messages.disputeUpdated, updatedResult);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
}