const bcrypt = require('bcryptjs');
const models = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
const testDbConnection = require('../config/database');

// Log available models at startup
console.log('Available models:', Object.keys(models));
console.log('adminUser model:', models.adminUser);

// Database check function
const checkDatabase = async () => {
  try {
    console.log('Checking database connection...');
    await models.sequelize.authenticate();
    console.log('Connection established');
    
    console.log('Checking adminUser model structure...');
    const tableInfo = await models.sequelize.query(
      'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'adminUsers\'',
      { type: models.sequelize.QueryTypes.SELECT }
    );
    console.log('Table structure:', tableInfo);
  } catch (error) {
    console.error('Database check error:', error);
    console.error('Error stack:', error.stack);
  }
};

// Test database connection at startup
testDbConnection.testDbConnection();

exports.createAdminUser = async function(req, res) {
    const { email, password } = req.body;
    try {
      console.log('Creating admin user with email:', email);
      // Check if user with this email already exists
      const existingUser = await models.adminUser.findOne({ where: { email: email } }); // Changed to findOne
      if (existingUser) {
        console.log('User already exists with email:', email);
        return errorResponse(res, httpCodes.badReq, Messages.emailAlreadyExist);
      }
      
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create a new user
      const newUser = {
        email,
        password: hashedPassword, 
        role: 0
      }
      console.log('Attempting to create new admin user:', { ...newUser, password: '[HIDDEN]' });
      const data = await models.adminUser.create(newUser);
      console.log('Successfully created admin user');

      return successResponse(res, Messages.userAdded, data);
    } catch (error) {
      console.error('Error creating admin user:', error);
      console.error('Error stack:', error.stack);
      return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
}

// Read All Admin Users
exports.getadminUsers = async (req, res) => {
    try {
      console.log('Starting getadminUsers');
      await checkDatabase(); // Add database check
      
      console.log('Attempting to find all admin users');
      const adminUsers = await models.adminUser.findAll();
      console.log('Found admin users:', adminUsers);
      
      return successResponse(res, Messages.getAllUsers, adminUsers);
    } catch (error) {
      console.error('Detailed error in getadminUsers:', error);
      console.error('Error stack:', error.stack);
      return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
};

// Read Admin User by ID
exports.getAdminUser = async (req, res) => {
    const { id } = req.params;
    try {
      console.log('Getting admin user by ID:', id);
      const adminUser = await models.adminUser.findByPk(id);
      if (!adminUser) {
        console.log('No admin user found with ID:', id);
        return errorResponse(res, httpCodes.badReq, Messages.usernotFound);
      }
      console.log('Found admin user:', adminUser);
      return successResponse(res, Messages.getAllUsers, adminUser);
    } catch (error) {
      console.error('Error getting admin user:', error);
      console.error('Error stack:', error.stack);
      return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
};

// Update Admin User
exports.updateAdminUser = async (req, res) => {
    const { id } = req.params;
    const { email, password, role } = req.body;
    try {
      console.log('Updating admin user with ID:', id);
      const adminUser = await models.adminUser.findByPk(id);
      if (!adminUser) {
        console.log('No admin user found with ID:', id);
        return errorResponse(res, httpCodes.badReq, Messages.usernotFound);
      }
      
      adminUser.email = email;
      adminUser.password = password;
      adminUser.role = role;
      
      console.log('Saving updated admin user');
      await adminUser.save(); // Changed from models.adminUser.save()
      console.log('Successfully updated admin user');
      
      return successResponse(res, Messages.userUpdated, adminUser);
    } catch (error) {
      console.error('Error updating admin user:', error);
      console.error('Error stack:', error.stack);
      return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
};

// Delete Admin User
exports.deleteAdminUser = async (req, res) => {
    const { id } = req.params;
    try {
      console.log('Deleting admin user with ID:', id);
      const adminUser = await models.adminUser.findByPk(id);
      if (!adminUser) {
        console.log('No admin user found with ID:', id);
        return errorResponse(res, httpCodes.badReq, Messages.usernotFound);
      }
      
      console.log('Destroying admin user');
      await adminUser.destroy(); // Changed from models.adminUser.destroy()
      console.log('Successfully deleted admin user');
      
      return successResponse(res, Messages.userDeleted, adminUser);
    } catch (error) {
      console.error('Error deleting admin user:', error);
      console.error('Error stack:', error.stack);
      return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
};