const bcrypt = require('bcryptjs');
const  models   = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
const testDbConnection = require('../config/database');

testDbConnection.testDbConnection();
exports.createAdminUser = async function(req, res){
    const { email, password } = req.body;
    try {
      // Check if user with this email already exists
      console.log(email, password, "print email and password here");
      const existingUser = await models.adminUser.findAll({ where: { email: email } });
      if (existingUser) {
        return errorResponse(res, httpCodes.badReq, Messages.emailAlreadyExist);
      }
      console.log("--- email not exist");
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword, "hashedPassword");
      // Create a new user
      const newUser = {
        email,
        password: hashedPassword, 
        role: 0
      }
      const data = await models.adminUser.create(newUser);

      return successResponse(res, Messages.userAdded, data);
    } catch (error) {
      console.error('Error registering user:', error);
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
}

// Read All Admin Users
exports.getadminUsers =  async (req, res) => {
    try {
      const adminUsers = await models.adminUser.findAll();
      return successResponse(res, Messages.getAllUsers, adminUsers);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Read Admin User by ID
  exports.getAdminUser =  async (req, res) => {
    const { id } = req.params;
    try {
      const adminUser = await models.adminUser.findByPk(id);
      if (!adminUser) {
        return errorResponse(res, httpCodes.badReq,Messages.usernotFound);
      }
      return successResponse(res, Messages.getAllUsers, adminUser);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Update Admin User
  exports.updateAdminUser =  async (req, res) => {
    const { id } = req.params;
    const { email, password, role } = req.body;
    try {
      const adminUser = await models.adminUser.findByPk(id);
      if (!adminUser) {
        return errorResponse(res, httpCodes.badReq,Messages.usernotFound);
      }
      adminUser.email = email;
      adminUser.password = password;
      adminUser.role = role;
      await models.adminUser.save();
      return successResponse(res, Messages.userUpdated, adminUser);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Delete Admin User
  exports.deleteAdminUser =  async (req, res) => {
    const { id } = req.params;
    try {
      const adminUser = await models.adminUser.findByPk(id);
      if (!adminUser) {
        return errorResponse(res, httpCodes.badReq,Messages.usernotFound)
      }
      await models.adminUser.destroy();
      return successResponse(res, Messages.userDeleted, adminUser);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  