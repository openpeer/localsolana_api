const models = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');

// method for adding the admin settings
exports.createAdminSettings = async function(req, res){
    const { name, value, description } = req.body;
    try {
      const newSettings = {
        name, value, description
      }
      const data = await models.setting.create(newSettings);
      return successResponse(res, Messages.success, data);
    } catch (error) {
      console.error('Error registering user:', error);
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
}

// Read All Admin Settings
exports.getadminSettings =  async (req, res) => {
    try {
      const adminSettings = await models.setting.findAll();
      return successResponse(res, Messages.getAdminSettings, adminSettings);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Read Admin Settings by ID
  exports.getAdminSetting =  async (req, res) => {
    const { id } = req.params;
    try {
      const adminSetting = await models.setting.findByPk(id);
      if (!adminSetting) {
        return errorResponse(res, httpCodes.badReq,Messages.usernotFound);
      }
      return successResponse(res, Messages.getAdminSettings, adminSetting);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Update Admin Settings by Id
  exports.updateAdminSetting =  async (req, res) => {
    const { id } = req.params;
    const { name, value, description } = req.body;
    try {
      const adminSetting = await models.setting.findByPk(id);
      if (!adminSetting) {
        return errorResponse(res, httpCodes.badReq,Messages.usernotFound);
      }
      adminSetting.name = name;
      adminSetting.value = value;
      adminSetting.description = description;
      let updatedSetting = await adminSetting.save();
      return successResponse(res, Messages.settingUpdated, updatedSetting);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Delete Admin Setting
  exports.deleteAdminSetting =  async (req, res) => {
    const { id } = req.params;
    try {
      const adminSetting = await models.setting.findByPk(id);
      if (!adminSetting) {
        return errorResponse(res, httpCodes.badReq,Messages.adminSettingsNotFound)
      }
      await adminSetting.destroy();
      return successResponse(res, Messages.deletedSuccessfully);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  