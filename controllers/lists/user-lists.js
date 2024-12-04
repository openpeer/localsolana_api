// controllers/lists/user-lists.js
const models = require('../../models');
const { errorResponse, successResponse } = require('../../utils/rest');
const Messages = require('../../utils/messages');
const httpCodes = require('../../utils/httpCodes');
const { Op } = require('sequelize');
const { processListData } = require('./shared/list-processing');

exports.fetchListForParticularUser = async (req, res) => {
  const { seller } = req.query;
  if (!seller) {
    return errorResponse(res, httpCodes.badReq, "Seller address is required");
  }

  try {
    const page = Math.max(parseInt(req.params.page) || 1, 1);
    const pageSize = Math.max(parseInt(req.params.pageSize) || 10, 1);
    const offset = (page - 1) * pageSize;

    const user = await models.user.findOne({
      where: { address: seller }
    });

    const listData = await models.lists.findAll({
      limit: pageSize,
      offset: offset,
      order: [["created_at", "DESC"]],
      where: {
        seller_id: user.dataValues.id,
        status: 1,
      },
    });

    let output = [];
    if (listData !== null) {
      for (const item of listData) {
        let result;
        if (item.dataValues.type === "SellList") {
          result = await processListData(item);
        } else {
          const bankIds = await models.lists_banks.findAll({
            attributes: ["bank_id"],
            where: { list_id: item.dataValues.id }
          });
          const bankIdsData = bankIds.map(record => record.dataValues.bank_id);
          result = await processListData(item, bankIdsData);
        }
        if (result) output.push(result);
      }
    } else {
      return errorResponse(res, httpCodes.badReq, Messages.noDataFound);
    }

    return successResponse(res, Messages.getList, output);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

exports.fetchMyAds = async (req, res) => {
  console.log("Fetching ads for user");
  const { user } = req;
  if (!user?.address) {
    console.error("User not authenticated or address missing");
    return errorResponse(res, httpCodes.badReq, "User not authenticated or address missing");
  }

  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.max(parseInt(req.query.pageSize) || 20, 1);
    const offset = (page - 1) * pageSize;

    const userData = await models.user.findOne({
      where: { address: user.address }
    });

    if (!userData) {
      console.error("User not found in database");
      return errorResponse(res, httpCodes.badReq, "User not found");
    }

    const listData = await models.lists.findAll({
      limit: pageSize,
      offset: offset,
      order: [["created_at", "DESC"]],
      where: {
        seller_id: userData.dataValues.id,
        status: { [Op.eq]: 1 },
        type: { [Op.ne]: null }
      }
    });

    const totalRecords = await models.lists.count({
      where: {
        seller_id: userData.dataValues.id,
        status: { [Op.eq]: 1 },
        type: { [Op.ne]: null }
      }
    });

    let output = [];
    for (const item of listData) {
      let result;
      if (item.dataValues.type === "SellList") {
        result = await processListData(item);
      } else {
        const bankIds = await models.lists_banks.findAll({
          attributes: ["bank_id"],
          where: { list_id: item.dataValues.id }
        });
        const bankIdsData = bankIds.map(record => record.dataValues.bank_id);
        result = await processListData(item, bankIdsData);
      }
      if (result) output.push(result);
    }

    const totalPages = Math.ceil(totalRecords / pageSize);

    return successResponse(res, Messages.getList, {
      data: output,
      meta: {
        current_page: page,
        total_pages: totalPages,
        total_count: totalRecords
      }
    });
  } catch (error) {
    console.error("Error fetching ads:", error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};