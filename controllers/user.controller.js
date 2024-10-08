const models = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
const { validationUserSchema } = require("../validate/user.validate");
require('dotenv').config();
const jwt = require('jsonwebtoken');

// create user
module.exports.createUser = async (req, res) => {
  try {
    let newUser = {
      address: req.body.address, 
      email: req.body.email,
      name: req.body.name,
      twitter: req.body.twitter,
      image: req.body.image,
      verified: req.body.verified,
      merchant: req.body.merchant,
      timezone: req.body.timezone,
      available_from: req.body.available_from,
      available_to: req.body.available_to,
      weeekend_offline: req.body.weeekend_offline,
      contract_address: req.body.contract_address
    };
    const userAlreadyCreated = await models.user.findOne({
      where: {
        email: req.body.email
      }
    });
    if (userAlreadyCreated) {
      return errorResponse(res, httpCodes.badReq,Messages.userAlreadyRegistered);
    }
    let data = await models.user.create(newUser);
    return successResponse(res, Messages.success, data);
  } catch (error) {
    console.error('Error registering user:', error);
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
  }  
}

module.exports.getUsersCount = async(req, res) => {
  try {
      const count = await models.user.count();
      return successResponse(res, Messages.success, count);
  } catch (error) {
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
  }
}

// Read All Users
exports.getAllUsers =  async (req, res) => {
  try {
    const users = await models.user.findAll();
    return successResponse(res, Messages.getAllUsers, users);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError,Messages.systemError);
  }
};

// Get User by address
exports.getUser =  async (req, res) => {
  const { address } = req.params;
  try {
    const { error } = validationUserSchema.validate(req.params);
      if (error) {
        return errorResponse(res, httpCodes.badReq,json({ errors: error.details.map(err => err.message) }));
      }
    const user = await models.user.findOne({
      where: {
        address: address
      }
    });
    if (!user) {
      let newUser = {
        address: address, 
        email: "",
        name: null,
        twitter: "",
        image: "",
        verified: false,
        merchant: false,
        timezone: "",
        weeekend_offline: false,
        contract_address: null
      };
      let data = await models.user.create(newUser);
      // const token = jwt.sign({ address: req.body.address }, process.env.JWT_SECRET, { expiresIn: '24h' });
      // data.dataValues['token'] = token;
      return successResponse(res, Messages.login, data);
    }else{
      // const token = jwt.sign({ address: req.body.address }, process.env.JWT_SECRET, { expiresIn: '24h' });
      // user.dataValues['token'] = token;
      return successResponse(res, Messages.login, user);
    }
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError,Messages.systemError);
  }
};
 
// Update User
exports.updateUser =  async (req, res) => {
  const { address } = req.params;
  console.log("req.body", req.body);
  const { email, name,twitter,image,verified, merchant,timezone,available_from,available_to,weeekend_offline, contract_address} = req.body;
  try {
    const user = await models.user.findOne({
      where: {
        address: address
      }})
    if (!user) {
      return errorResponse(res, httpCodes.badReq,Messages.usernotFound);
    }
   
    user.email =email,
    user.name = name,
    user.twitter=twitter,
    user.image=image,
    user.verified=verified,
    user.merchant = merchant,
    user.timezone=timezone,
    user.available_from = available_from,
    user.available_to=available_to,
    user.weeekend_offline = weeekend_offline,
    user.contract_address = contract_address
      await user.save();
      console.log("user", user);
    return successResponse(res, Messages.userUpdated, user);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError,Messages.systemError);
  }
};

//get particular user with payment methods
exports.getParticularUser =  async (req, res) => {
  try {
    const { id } = req.params;
    const users = await models.user.findByPk(id);
    const fetchPaymentMethod = await models.payment_methods.find({
      where: {
        user_id: id
      }
    })
    users.datavalues["paymentMethods"] = fetchPaymentMethod.datavalues;
    return successResponse(res, Messages.getAllUsers, users);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError,Messages.systemError);
  }
};
