const models = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
const priceSourceMethod = require('../utils/commonEnums');
const { sequelize } = require('../models');
const { QueryTypes, where, and } = require('sequelize');
const { min } = require("moment");
const { Op } = require('sequelize');
 
// method for adding the fiat currencies
exports.createList = async function(req, res){
    try {
      //console.log(req.body);
      let chain_id = 1;
        const {seller_address, token_id, fiat_currency_id, total_available_amount, limit_min, limit_max,
          margin_type, margin, terms, automatic_approval, type, bank_id, deposit_time_limit
          ,payment_time_limit, accept_only_verified, escrow_type, price_source, payment_methods, price
         } = req.body;
         const user = await models.user.findOne({
          where: {
            address: seller_address
          }
        });
      //console.log("user" ,user)
      if(user !== null){
      let savedPaymentData;
      const createListObject = {
        chain_id, seller_id: user.dataValues.id, token_id, fiat_currency_id, total_available_amount, limit_min, limit_max,
      margin_type, margin, terms, automatic_approval, status : 0 , payment_method_id: null, type, deposit_time_limit
      ,payment_time_limit, accept_only_verified, escrow_type, price_source, price
      }
     // console.log("createListObject", createListObject);
      const listCreatedData = await models.lists.create(createListObject);
      let bankIds = [];
     // console.log("Data", listCreatedData);
      if(type == "SellList"){
        if(payment_methods.length > 0){
          for (const item of payment_methods) {
            savedPaymentData = await new Promise(async(resolve) => {
             // console.log('element', item);
              //console.log("------------item----------", item.bank_id);
              bankIds.push(item.bank_id);
              let paymentMethodData = {
                user_id : user.dataValues.id,
                bank_id: item.bank_id,
                type: 'ListPaymentMethod',
                values: item.values
              }
              const paymentMethod  = await models.payment_methods.create(paymentMethodData);
              //console.log("paymentMethod", paymentMethod);
              if(paymentMethod){
                const data = {
                  list_id: listCreatedData.dataValues.id,
                  payment_method_id: paymentMethod.dataValues.id
                }
                const result = await sequelize.query(
                  `INSERT INTO "lists_payment_methods" ("list_id", "payment_method_id")
                   VALUES (${listCreatedData.dataValues.id}, ${paymentMethod.dataValues.id})
                   `,
                  {
                    type: QueryTypes.INSERT
                  })
              //  const list_payment_methods_data  = await models.lists_payment_methods.create(data);
                console.log("list_payment_methods", result);
              }
              resolve(paymentMethod);
            });

          }
        }
      }else{
        bankIds = req.body.bank_ids;
        if(bankIds.length > 0){
          for(let id of bankIds){
            const result = await sequelize.query(
              `INSERT INTO "lists_banks" ("list_id", "bank_id")
               VALUES (${listCreatedData.dataValues.id}, ${id})
               `,
              {
                type: QueryTypes.INSERT
              })
           // console.log("bankIds", result);
          }
        }
      }
     // console.log("bankIds", bankIds);
      const data = await fetchedListLoop(listCreatedData, bankIds);     
      return successResponse(res, Messages.success, data);
    }else{
      return successResponse(res, 'No user found', []);
    }
    } catch (error) {
      console.log(error);
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
}

// Read All lists
exports.getAllLists =  async (req, res) => {
    try {
      const { type, amount, currency, payment_method, token, fiat_amount } = req.query;
        const filter = {};

        // Adding filters based on provided query parameters
        if (type) {
          filter.type = type;
        }
        if (amount) {
          filter.total_available_amount =  { [Op.gte]: amount };;
        }
        if (currency) {
          filter.fiat_currency_id = currency;
        }
        if (token) {
          filter.token_id = token;
        }

        if (fiat_amount) {
          filter[Op.or] = [
            {
              
              [Op.and]: [
                { limit_min: { [Op.gte]: fiat_amount } }, 
                { limit_max: { [Op.lte]: fiat_amount } }  
              ]
            },
            {
              [Op.and]: [
                { limit_min: { [Op.is]: null } }, 
                { limit_max: { [Op.is]: null } }  
              ]
            }
          ];
        }

       // console.log("filter-------------", filter);

        let page = req.query.page ? req.query.page : 1;
        let pageSize = req.query.pageSize ? req.query.pageSize : 20;
        const pageNumber = Math.max(parseInt(page), 1);
        const pageSizeNumber = Math.max(parseInt(pageSize), 1);
        const offset = (pageNumber - 1) * pageSizeNumber;
        const totalRecords = await models.lists.count({where: filter});
        const totalPages = Math.ceil(totalRecords / 20);
        const listData = await models.lists.findAll({
            where: {
              ...filter,
              status: {
                [Op.eq]: 1,
              },
            },
            limit: pageSizeNumber,
           offset: offset,
            order: [['created_at', 'DESC']],
          });
          //console.log(listData); // Output the result
      let output = [];
      if(listData !== null ){
        for (const item of listData) {
          let bankIdsData = [];
      if(type === 'SellList'){
        const result = await fetchedListLoop(item);
      //  console.log("data", data);
        output.push(result);
        
      }else if (type === 'BuyList'){
        const bankIds = await models.lists_banks.findAll({
          attributes: ['bank_id'],
          where: {
            list_id: item.dataValues.id
          }
        });
        bankIds.forEach(record => {
          let banks = record.dataValues.bank_id; // Extract data values from each record
          bankIdsData.push(banks);
        })
        const result = await fetchedListLoop(item, bankIdsData);
   
        //console.log("data", data);
        output.push(result);
        //return successResponse(res, Messages.getList, output);
      }
          else{

          }
        }
      }else{
        return errorResponse(res, httpCodes.badReq,Messages.noDataFound);
      }
      let results = {
        data: output, 
        meta: {
          "current_page": pageNumber,
          "total_pages": totalPages, 
          "total_count": totalRecords
        }
      }
      // console.log("output--------------------------", output);
      // console.log(successResponse(res, Messages.getList, output));
      return successResponse(res, Messages.getList, results);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // Get List by Id
  exports.getList =  async (req, res) => {
    const { id } = req.params;
    try {
      const list = await models.lists.findByPk(id);
      if (!list) {
        return errorResponse(res, httpCodes.badReq,Messages.listNotFound);
      }
      let bankIdsData = [];
      if(list.dataValues.type == 'SellList'){
        const data = await fetchedListLoop(list);
      //  console.log("data", data);
      return successResponse(res, Messages.getList, data);
      }else{
        const bankIds = await models.lists_banks.findAll({
          attributes: ['bank_id'],
          where: {
            list_id: list.dataValues.id
          }
        });
        bankIds.forEach(record => {
          let banks = record.dataValues.bank_id; // Extract data values from each record
          bankIdsData.push(banks);
        })
        const data = await fetchedListLoop(list, bankIdsData);
   
     //   console.log("data", data);
      return successResponse(res, Messages.getList, data);
      }
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
  // method for updating the list
  exports.updateList =  async (req, res) => {
    const { id } = req.params;
    const { chain_id, seller_id, token_id, fiat_currency_id, total_available_amount, limit_min, limit_max, 
      margin_type, margin, terms, automatic_approval, status, payment_method_id, type, bank_id, deposit_time_limit,
      payment_time_limit, accept_only_verified, escrow_type, price_source, price, payment_methods
     } = req.body;
    const {user}=req;
    try {
      
      const fetchedList = await models.lists.findByPk(id);
      if (!fetchedList) {
        return errorResponse(res, httpCodes.badReq,Messages.listNotFound);
      }
      (fetchedList.chain_id = chain_id),
      (fetchedList.seller_id = seller_id),
      (fetchedList.token_id = token_id),
      (fetchedList.fiat_currency_id = fiat_currency_id),
      (fetchedList.total_available_amount = total_available_amount),
      (fetchedList.limit_min = limit_min),
      (fetchedList.limit_max = limit_max),
      (fetchedList.margin_type = margin_type),
      (fetchedList.margin = margin),
      (fetchedList.terms = terms),
      (fetchedList.automatic_approval = automatic_approval),
      (fetchedList.status = status),
      (fetchedList.payment_method_id = payment_method_id),
      (fetchedList.type = type),
      (fetchedList.bank_id = bank_id),
      (fetchedList.deposit_time_limit = deposit_time_limit),
      (fetchedList.payment_time_limit = payment_time_limit),
      (fetchedList.accept_only_verified = accept_only_verified),
      (fetchedList.escrow_type = escrow_type),
      (fetchedList.price_source = price_source),
      (fetchedList.price = price);
      
      bankIds = req.body.bank_ids;
      
      if (type==='BuyList' && bankIds.length > 0) {
        // First, get all existing bank IDs for this list
        const existingEntries = await sequelize.query(
          `SELECT bank_id FROM "lists_banks" 
           WHERE list_id = ${id}`,
          {
            type: QueryTypes.SELECT
          }
        );
        
        const existingBankIds = existingEntries.map(entry => entry.bank_id);
        
        // Delete entries that are not in the new bankIds
        await sequelize.query(
          `DELETE FROM "lists_banks" 
           WHERE list_id = :listId 
           AND bank_id NOT IN (:bankIds)`,
          {
            replacements: { 
              listId: id,
              bankIds: existingBankIds.join(",")
            },
            type: QueryTypes.DELETE
          }
        );
        
        const list_id=id;
        // Insert new entries that don't exist yet
        for (let value of bankIds) {
          await sequelize.query(
            `INSERT INTO "lists_banks" ("list_id", "bank_id")
             VALUES (:listId, :bankId)
             ON CONFLICT ("list_id", "bank_id") DO NOTHING`,
            {
              replacements: {
                listId: list_id,
                bankId: value.id
              },
              type: QueryTypes.INSERT
            }
          );
        }
      }
      else if(type==='SellList' && payment_methods.length > 0){
        
          const list_id=id;
          // First, get all existing payment method IDs for this list
          const existingPaymentMethodIds = await models.lists_payment_methods.findAll({
            where:{
              list_id:list_id
            },
            attributes:['list_id','payment_method_id']
          });

          const deletedValues = await models.lists_payment_methods.destroy({
            where: {
              payment_method_id: existingPaymentMethodIds.map((data)=>data.payment_method_id) ,
              list_id:list_id
            }
          });

          payment_methods.forEach(async (params) => {
            
            const result=await models.payment_methods.findOne({
              where:{
                user_id:user.id,
                bank_id:params.bank_id
              }
            });

            let payment_method_id=0;
            if(!result){
               const payment_method_created=models.payment_methods.create([
                {
                  user_id:user.id,
                  bank_id:params.bank_id,
                  values:params.values,
                  type:'ListPaymentMethod'
                }
              ]);
              payment_method_id=payment_method_created.dataValues.id;
            }else{
              payment_method_id=result.dataValues.id;
  
              await models.payment_methods.update({
                values:params.values},{
                where:{
                  user_id:user.id,
                  bank_id:params.bank_id
                }
              });
            }

            const check_existence_in_list_payment_methods = await models.lists_payment_methods.findOne({
              where:{
                list_id:list_id,
                payment_method_id:payment_method_id
              },
              attributes:['list_id','payment_method_id']
            });

            if(!check_existence_in_list_payment_methods){
              const result1 = await sequelize.query(
                `INSERT INTO "lists_payment_methods" ("list_id", "payment_method_id")
                VALUES (${list_id}, ${payment_method_id})
                `,
                {
                  type: QueryTypes.INSERT
                });
              // console.log(result1);
            }
          });
      }

      let updatedList = await fetchedList.save();
      return successResponse(res, Messages.updatedList, updatedList);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };
  
// method for deleting the list using id as a parameter
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
  
  //method for getting the count for the lists
  module.exports.getListsCount = async(req, res) => {
    try {
        const count = await models.lists.count();
        return successResponse(res, Messages.success, count);
    } catch (error) {
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  }

  async function fetchedListLoop(element, banksIds = null) {
    return new Promise(async(resolve) => {
      let banksData= [];
    //  console.log("banksIds", banksIds)
        if(banksIds){
          for(let item of banksIds){
         //   console.log("------------bank Id", item)
            let particularBankData = await models.banks.findByPk(item);
         //   console.log("particularBankData", particularBankData);
              let data = particularBankData.dataValues; // Extract data values from each record
          //    console.log("data------------------",data)
              banksData.push(data);
          }
        }
    //    console.log("element.dataValues.bank_id", element.dataValues.bank_id);
        
      let fiatCurrencyData;
      if(element.dataValues.fiat_currency_id !== "" || element.dataValues.fiat_currency_id !== null){
        fiatCurrencyData  = await models.fiat_currencies.findByPk(element.dataValues.fiat_currency_id);
      }
      let tokenData;
      if(element.dataValues.token_id !== "" || element.dataValues.token_id !== null){
        tokenData  = await models.tokens.findByPk(element.dataValues.token_id);
      }
     
      let totalPaymentMethods = [];
      const paymentMethodsIds = await models.lists_payment_methods.findAll({
        attributes: ['payment_method_id'],
        where: {
          list_id: element.dataValues.id
        }
      });
    //console.log("paymentMethodsIds", paymentMethods);
      if(element.dataValues.payment_method_id !== "" || element.dataValues.payment_method_id !== null){
        for(let item of paymentMethodsIds){
         let paymentMethodsData  = await models.payment_methods.findAll({
            where: {
              id :item.dataValues.payment_method_id,
              user_id: element.dataValues.seller_id
        }});
        for (let record of paymentMethodsData){
          let paymentMethodData = record.dataValues; // Extract data values from each record
        //  console.log(" -------------------paymentMethodData", paymentMethodData);
          let particularBankData = await models.banks.findByPk(paymentMethodData.bank_id);
       //   console.log("------------------banks --------", particularBankData);
          paymentMethodData['bank'] = particularBankData; 
          totalPaymentMethods.push(paymentMethodData); // Push the processed data to the final array
        };
        }
      }
      let userData; 
      if(element.dataValues.seller_id !== "" || element.dataValues.seller_id !== null){
        userData  = await models.user.findByPk(element.dataValues.seller_id);
        let contracts = await models.contracts.findAll({
          where: {
            user_id: element.dataValues.seller_id, 
            chain_id: element.dataValues.chain_id,
          }
        })
        //console.log("contracts", contracts);
        userData.dataValues['contracts'] = contracts;
        //console.log("userData", userData); 
      }
      
     // console.log("list", list);
      console.log()
      let response = {
        id: element.dataValues.id, 
        automatic_approval : element.dataValues.automatic_approval,
        chain_id : element.dataValues.chain_id,
        limit_min: element.dataValues.limit_min,
        limit_max: element.dataValues.limit_max,
        price:element.dataValues.price,
        margin_type: element.dataValues.margin_type,
        margin: element.dataValues.margin,
        status: element.dataValues.status,
        terms: element.dataValues.terms,
        token: element.dataValues.token_id,
        bank: banksData,
        total_available_amount: element.dataValues.total_available_amount,
        type: element.dataValues.type,
        deposit_time_limit : element.dataValues.deposit_time_limit,
        payment_time_limit: element.dataValues.payment_time_limit,
        accept_only_verified: element.dataValues.accept_only_verified,
        escrow_type : element.dataValues.escrow_type == 0 ? 'manual' : 'instant',
        price_source : priceSourceMethod.priceSourceFunction(element.dataValues.price_source),
        fiat_currency: fiatCurrencyData,
        token : tokenData,
        payment_methods: totalPaymentMethods,
        seller: userData,
      } 
    ///  console.log("response", response)
        resolve(response);
    });
  }

  exports.fetchListForParticularUser =  async (req, res) => {
    const { seller } = req.query;
    try {
     // console.log("userId", seller);
      let page = req.params.page ? req.params.page :  1;
      let pageSize = req.params.pageSize ? req.params.pageSize : 10
      const pageNumber = Math.max(parseInt(page), 1);
      const pageSizeNumber = Math.max(parseInt(pageSize), 1);
      const offset = (pageNumber - 1) * pageSizeNumber;
      const user = await models.user.findOne({
        where: {
          address: seller
        }
      });
      //console.log("user",user)
      const listData = await models.lists.findAll({
        limit: pageSizeNumber,
          offset: offset,
          order: [['created_at', 'DESC']] ,
        where:{
          seller_id : user.dataValues.id,
        }
      });
      //console.log("listData", listData);
      let output = [];
      if(listData !== null ){
        for (const item of listData) {
          let bankIdsData = [];
      if(item.dataValues.type == 'SellList'){
        const result = await fetchedListLoop(item);
      //  console.log("data", data);
        output.push(result);
      }else{
        const bankIds = await models.lists_banks.findAll({
          attributes: ['bank_id'],
          where: {
            list_id: item.dataValues.id
          }
        });
        bankIds.forEach(record => {
          let banks = record.dataValues.bank_id; // Extract data values from each record
          bankIdsData.push(banks);
        })
        const result = await fetchedListLoop(item, bankIdsData);
   
        //console.log("data", data);
        output.push(result);
      }
          
        }
      }else{
        return errorResponse(res, httpCodes.badReq,Messages.noDataFound);
      }
      return successResponse(res, Messages.getList, output);
    } catch (error) {
      console.error(error);
      return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
  };

  exports.testListController = async(req, res) => {
    try {
    const [results, metadata] = await sequelize.query(`
      SELECT 
        lists.*, 
        users.*, 
        tokens.*, 
        fiat_currencies.*, 
        payment_methods.*, 
        banks.*
      FROM lists
      LEFT JOIN users ON lists.seller_id = users.id
      LEFT JOIN tokens ON lists.token_id = tokens.id
      LEFT JOIN fiat_currencies ON lists.fiat_currency_id = fiat_currencies.id 
      LEFT JOIN payment_methods ON lists.payment_method_id = payment_methods.id
      LEFT JOIN banks ON payment_methods.bank_id = banks.id
      where lists.id = 3265;
    `, {
      type: sequelize.QueryTypes.SELECT
    });
   // console.log("result", results);
      res.json({
        data: results
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  exports.fetchMyAds = async (req, res) => {
    console.log('here in my ads');
    const { user } = req;
    try {
      let page = req.query.page ? req.query.page : 1;
      let pageSize = req.query.pageSize ? req.query.pageSize : 20;
      const pageNumber = Math.max(parseInt(page), 1);
      const pageSizeNumber = Math.max(parseInt(pageSize), 1);
      const offset = (pageNumber - 1) * pageSizeNumber;
      const userData = await models.user.findOne({
        where: {
          address: user.address,
        },
        limit: pageSizeNumber,
        offset: offset,
        order: [["created_at", "DESC"]],
      });
      //console.log("user",user)
      const listData = await models.lists.findAll({
        limit: pageSizeNumber,
        offset: offset,
        order: [["created_at", "DESC"]],
        where: {
          seller_id: userData.dataValues.id,
          status: {
            [Op.ne]: 2,
          },
        },
      });
      //console.log("listData", listData);
      let output = [];
      if (listData !== null) {
        for (const item of listData) {
          let bankIdsData = [];
          if (item.dataValues.type == "SellList") {
            const result = await fetchedListLoop(item);
            //  console.log("data", data);
            output.push(result);
          } else {
            const bankIds = await models.lists_banks.findAll({
              attributes: ["bank_id"],
              where: {
                list_id: item.dataValues.id,
              },
            });
            bankIds.forEach((record) => {
              let banks = record.dataValues.bank_id; // Extract data values from each record
              bankIdsData.push(banks);
            });
            const result = await fetchedListLoop(item, bankIdsData);
  
            //console.log("data", data);
            output.push(result);
          }
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