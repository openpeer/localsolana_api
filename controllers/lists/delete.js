// controllers/lists/delete.js
const models = require('../../models');
const { errorResponse, successResponse } = require('../../utils/rest');
const Messages = require('../../utils/messages');
const httpCodes = require('../../utils/httpCodes');

exports.deleteList = async (req, res) => {
  try {
    // Begin transaction
    await models.sequelize.transaction(async (t) => {
      // First delete related payment methods
      await models.lists_payment_methods.destroy({
        where: { list_id: req.params.id },
        transaction: t
      });

      // Then delete the list
      await models.lists.destroy({
        where: { id: req.params.id },
        transaction: t
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: 'Failed to delete list' });
  }
};