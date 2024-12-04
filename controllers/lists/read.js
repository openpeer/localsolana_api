

// controllers/lists/read.js
const models = require('../../models');
const { errorResponse, successResponse } = require('../../utils/rest');
const Messages = require('../../utils/messages');
const httpCodes = require('../../utils/httpCodes');
const { Op } = require('sequelize');
const { processListData } = require('./shared/list-processing');

exports.getAllLists = async (req, res) => {
  try {
    const { type, amount, currency, payment_method, token, fiat_amount } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (amount) filter.total_available_amount = { [Op.gte]: amount };
    if (currency) filter.fiat_currency_id = currency;
    if (token) filter.token_id = token;

    if (fiat_amount) {
      filter[Op.or] = [
        {
          [Op.and]: [
            { limit_min: { [Op.gte]: fiat_amount } },
            { limit_max: { [Op.lte]: fiat_amount } },
          ],
        },
        {
          [Op.and]: [
            { limit_min: { [Op.is]: null } },
            { limit_max: { [Op.is]: null } },
          ],
        },
      ];
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.max(parseInt(req.query.pageSize) || 20, 1);
    const offset = (page - 1) * pageSize;
    
    const totalRecords = await models.lists.count({ where: filter });
    const totalPages = Math.ceil(totalRecords / pageSize);
    
    const listData = await models.lists.findAll({
      where: {
        ...filter,
        status: { [Op.eq]: 1 },
      },
      limit: pageSize,
      offset: offset,
      order: [["created_at", "DESC"]],
    });

    const output = [];
    for (const item of listData) {
      let result;
      if (item.dataValues.type === "SellList") {
        result = await processListData(item);
      } else if (item.dataValues.type === "BuyList") {
        const bankIds = await models.lists_banks.findAll({
          attributes: ["bank_id"],
          where: { list_id: item.dataValues.id },
        });
        const bankIdsData = bankIds.map(record => record.dataValues.bank_id);
        result = await processListData(item, bankIdsData);
      }

      if (result && result.seller && result.seller.address) {
        output.push(result);
      }
    }

    const results = {
      data: output,
      meta: {
        current_page: page,
        total_pages: totalPages,
        total_count: output.length,
      },
    };

    return successResponse(res, Messages.getList, results);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

exports.getList = async (req, res) => {
  const { id } = req.params;
  try {
    const list = await models.lists.findOne({
      where: {
        id: id,
        status: {
          [Op.notIn]: [0, 2], // Exclude status 0 and 2(Hidden and deleted status)
        },
      },
    });

    if (!list) {
      return errorResponse(res, httpCodes.badReq, Messages.listNotFound);
    }

    let data;
    if (list.dataValues.type === "SellList") {
      data = await processListData(list);
    } else {
      const bankIds = await models.lists_banks.findAll({
        attributes: ["bank_id"],
        where: { list_id: list.dataValues.id },
      });
      const bankIdsData = bankIds.map(record => record.dataValues.bank_id);
      data = await processListData(list, bankIdsData);
    }

    return successResponse(res, Messages.getList, data);
  } catch (error) {
    console.error(error);
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};

exports.getListsCount = async (req, res) => {
  try {
    const count = await models.lists.count();
    return successResponse(res, Messages.success, count);
  } catch (error) {
    return errorResponse(res, httpCodes.serverError, Messages.systemError);
  }
};