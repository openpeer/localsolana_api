// controllers/lists/delete.js
const models = require('../../models');
const { errorResponse, successResponse } = require('../../utils/rest');
const Messages = require('../../utils/messages');
const httpCodes = require('../../utils/httpCodes');

exports.deleteList = async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  
  try {
    const fetchedList = await models.lists.findByPk(id);
    if (!fetchedList) {
      return errorResponse(res, httpCodes.badReq, Messages.listNotFound);
    }
    
    if (fetchedList.dataValues.seller_id == user.dataValues.id) {
      fetchedList.set("status", 2);
      await fetchedList.save();
      return successResponse(res, Messages.deletedSuccessfully);
    } else {
      return errorResponse(res, httpCodes.forbidden, Messages.NoAccess);
    }
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};