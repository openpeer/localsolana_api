const models = require("../models/index");
const { errorResponse, successResponse } = require("../utils/rest");
const Messages = require("../utils/messages");
const httpCodes = require("../utils/httpCodes");
const { validationUserSchema } = require("../validate/user.validate");
require("dotenv").config();
const { identifyUser } = require("../services/knockService");
const { PublicKey } = require("@solana/web3.js");
const getLocalSolanaAccount = function (userAddress) {
  const [escrowStatePda_, escrowStateBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_state"), new PublicKey(userAddress).toBuffer()],
    new PublicKey("1w3ekpHrruiEJPYKpQH6rQssTRNKCKiqUjfQeJXTTrX")
  );
  return escrowStatePda_;
};
const {isOnline}= require("../utils/util");

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
      contract_address: req.body.contract_address,
      telegram_user_id: req.body.telegram_user_id,
      telegram_username: req.body.telegram_username,
      whatsapp_country_code: req.body.whatsapp_country_code,
      whatsapp_number: req.body.whatsapp_number,
    };
    const userAlreadyCreated = await models.user.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (userAlreadyCreated) {
      return errorResponse(
        res,
        httpCodes.badReq,
        Messages.userAlreadyRegistered
      );
    }
    let data = await models.user.create(newUser);
    return successResponse(res, Messages.success, data);
  } catch (error) {
    console.error("Error registering user:", error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

module.exports.getUsersCount = async (req, res) => {
  try {
    const count = await models.user.count();
    return successResponse(res, Messages.success, count);
  } catch (error) {
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// Read All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await models.user.findAll();
    return successResponse(res, Messages.getAllUsers, users);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// Get User by address
exports.getUser = async (req, res) => {
  const { address } = req.params;
  try {
    const { error } = validationUserSchema.validate(req.params);
    if (error) {
      return errorResponse(
        res,
        httpCodes.badReq,
        json({ errors: error.details.map((err) => err.message) })
      );
    }
    const user = await models.user.findOne({
      where: {
        address: address,
      },
    });
    let updatedUserData = null;
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
        contract_address: null,
      };
      let data = await models.user.create(newUser);
      
      // Step 2: Generate LocalSolanaAccount
      const localSolanaAccount = getLocalSolanaAccount(address);

      // Step 3: Update the order with the generated tradeID
      const [affectedRows, [updatedUser]] = await models.user.update(
        { contract_address: localSolanaAccount.toBase58() },
        { where: { id: data.dataValues.id }, returning: true }
      );
      updatedUser.dataValues['online'] = isOnline(updatedUser.dataValues.timezone, updatedUser.dataValues.available_from, updatedUser.dataValues.available_to, updatedUser.dataValues.weeekend_offline);

      return successResponse(res, Messages.login, updatedUser);
    } else {
      
      if (user.dataValues.contract_address == null) {
        // Step 2: Generate LocalSolanaAccount
        const localSolanaAccount = getLocalSolanaAccount(address);

        // Step 3: Update the order with the generated tradeID
        const [affectedRows, [updatedUser]] = await models.user.update(
          { contract_address: localSolanaAccount.toBase58() },
          { where: { id: user.dataValues.id }, returning: true }
        );
        updatedUser.dataValues['online'] = isOnline(updatedUser.dataValues.timezone, updatedUser.dataValues.available_from, updatedUser.dataValues.available_to, updatedUser.dataValues.weeekend_offline);
        updatedUserData = updatedUser;
      }

      if(user){
        updatedUserData=user;
        updatedUserData.dataValues['online'] = isOnline(updatedUserData.dataValues.timezone, updatedUserData.dataValues.available_from, updatedUserData.dataValues.available_to, updatedUserData.dataValues.weeekend_offline);
      }
    }
    return successResponse(res, Messages.login, updatedUserData??user);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

// Update User
exports.updateUser = async (req, res) => {
  const { address } = req.params;
  console.log("req.body", req.body);
  try {
    const user = await models.user.findOne({
      where: {
        address: address,
      },
    });
    if (!user) {
      return errorResponse(res, httpCodes.badReq, Messages.usernotFound);
    }

    const { user_profile } = req.body; // Extract user_profile from req.body

    const [affectedRows, [updatedUser]] = await models.user.update(
      { ...user_profile }, // Spread user_profile instead of req.body
      {
        where: {
          address: address,
        },
        returning: true,
      }
    );
    console.log("user", updatedUser);
    if (user_profile.email && user_profile.name) {
      await identifyUser(user.address, {
        name: user_profile.name,
        email: user_profile.email,
      });
    }
    return successResponse(res, Messages.userUpdated, updatedUser);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

//get particular user with payment methods
exports.getParticularUser = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await models.user.findByPk(id);
    const fetchPaymentMethod = await models.payment_methods.find({
      where: {
        user_id: id,
      },
    });
    users.datavalues["paymentMethods"] = fetchPaymentMethod.datavalues;
    return successResponse(res, Messages.getAllUsers, users);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};
