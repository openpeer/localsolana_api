const models  = require("../models/index");
const { sequelize } = require('../models');
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
const priceSourceMethod = require('../utils/commonEnums');

exports.quickBuy =  async (req, res) => {
    try {
    const {type, fiat_currency_code, token_symbol, token_amount} = req.query;
    const [results, metadata] = await sequelize.query(`
      SELECT 
        lists.*, 
        users.*, 
        tokens.*, 
        fiat_currencies.*, 
        banks.*
      FROM lists
      LEFT JOIN users ON lists.seller_id = users.id
      LEFT JOIN tokens ON lists.token_id = tokens.id AND tokens.symbol = :token_symbol
      LEFT JOIN fiat_currencies ON lists.fiat_currency_id = fiat_currencies.id AND fiat_currencies.code = :fiat_currency_code
      LEFT JOIN users AS payment_users ON payment_methods.user_id = payment_users.id
      LEFT JOIN banks ON payment_methods.bank_id = banks.id
      where lists.total_available_amount >= :token_amount AND lists.type = :type
    `, {
      replacements: { token_symbol: token_symbol, fiat_currency_code: fiat_currency_code, token_amount: token_amount, type: type},
      type: sequelize.QueryTypes.SELECT
    });

    //results['escrow_type'] = results['escrow_type'] == 0 ? 'manual' : 'instant';
    //results['price_source'] =  priceSourceMethod.priceSourceFunction(results['price_source']);
      return successResponse(res, Messages.getAllLists, results);

    }
    catch(error){
      console.log(error);
    }
  }
    // console.log("fiat_currency_code", fiat_currency_code);
    // const fiatCurrencyData = await fiatCurrency(fiat_currency_code);
    // console.log("fiatCurrencyData", fiatCurrencyData);
    // const token = await tokenData(token_symbol);
    // console.log("token", token.dataValues.id);
    // const listdata = await models.lists.findOne({
    //   where: {
    //     token_id: token.dataValues.id
    //   }
    // })
    // console.log("listdata", listdata);
    // return listdata;
    // }
    // catch (error) {
    //   console.error('Error fetching token or fiat currency:', error);
    //   return {};
    // }
    // condition for fiat currency code 
  
// const index = async (req, res) => {
//   try {
//     let lists = await models.lists.findAll({
//       include: [
//         { model: Seller },
//         { model: Token, where: { symbol: req.params.token_symbol } },
//         { model: FiatCurrency, where: { code: req.params.fiat_currency_code } },
//         { model: PaymentMethod, include: [{ model: User }, { model: Bank }] }
//       ],
//       where: {
//         ...(req.query.token_amount ? { total_available_amount: { [Sequelize.Op.gte]: req.query.token_amount } } : {}),
//         ...(req.query.fiat_amount ? await totalFiatCondition(req.query.fiat_amount, req.params.token_symbol, req.params.fiat_currency_code) : {}),
//         ...(req.query.chain_id ? { chain_id: req.query.chain_id } : {})
//       }
//     });

//     lists = lists.sort((a, b) => a.price - b.price);

//     // Assuming you have a ListSerializer implementation or format your output here
//     res.status(200).json({ data: lists });
//   } catch (error) {
//     console.error('Error fetching lists:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };


// Private function to handle fiat amount condition
const totalFiatCondition = async (fiatAmount, tokenSymbol, fiatCurrencyCode) => {
  try {
    const token = await models.token.findOne({
      where: { symbol: tokenSymbol },
      include: [{ model: FiatCurrency, where: { code: fiatCurrencyCode } }]
    });

    if (!token) return {};

    const amount = parseFloat(fiatAmount);
    const tokenPrice = await token.priceInCurrency(fiatCurrencyCode); // You need to implement this method in your Token model

    return {
      total_available_amount: {
        [Sequelize.Op.gte]: amount / (token.margin_type === 'fixed' ?
          token.margin :
          (tokenPrice + (tokenPrice * token.margin / 100)))
      },
      ...(token.limit_min ? { limit_min: { [Sequelize.Op.lte]: amount } } : {}),
      ...(token.limit_max ? { limit_max: { [Sequelize.Op.gte]: amount } } : {})
    };
  } catch (error) {
    console.error('Error fetching token or fiat currency:', error);
    return {};
  }
};


    // return successResponse(res, Messages.success, paymentMethods);
    // } catch (error) {
    //   console.error(error);
    //   return errorResponse(res, httpCodes.serverError,Messages.systemError);
    // }

const fiatCurrency = async (fiat_currency_code) => {
  try {
    console.log("fiat_currency_code", fiat_currency_code);
    if(!fiat_currency_code == null || !fiat_currency_code == ""){
      const fiatCurrencyData = await models.fiat_currencies.findOne({
        where: {
          code : fiat_currency_code
        }
      })
      return fiatCurrencyData;
    }
  } catch (error) {
    console.log(error);
  }
}

const tokenData = async (tokenSymbol) => {
  try {
    if(!tokenSymbol == null || !tokenSymbol == ""){
      const fetchedTokenData = await models.tokens.findOne({
        where: {
          symbol : tokenSymbol
        }
      })
      return fetchedTokenData;
    }
  } catch (error) {
    console.log(error);
  }
}
// let banks;
//       if(list.dataValues.bank_id == null){
//         banks = null;
//       }else{
//         banks = await models.banks.findByPk(list.dataValues.bank_id);
//       }
//       let fiatCurrencyData;
//       if(list.dataValues.fiat_currency_id !== "" || list.dataValues.fiat_currency_id !== null){
//         fiatCurrencyData  = await models.fiat_currencies.findByPk(list.dataValues.fiat_currency_id);
//       }
      
//       let paymentMethodsData;
//       if(list.dataValues.payment_method_id !== "" || list.dataValues.payment_method_id !== null){
//         paymentMethodsData  = await models.payment_methods.findByPk(list.dataValues.payment_method_id);
//       }
//       let userData; 
//       if(list.dataValues.seller_id !== "" || list.dataValues.seller_id !== null){
//         userData  = await models.user.findByPk(list.dataValues.seller_id);
//         let contracts = await models.contracts.findAll({
//           where: {
//             user_id: list.dataValues.seller_id, 
//             chain_id: list.dataValues.chain_id,
//           }
//         })
//         console.log("contracts", contracts);
//         userData.dataValues['contracts'] = contracts;
//         console.log("userData", userData); 
//       }
      
//      // console.log("list", list);
//       console.log()
//       let response = {
//         id: list.dataValues.id, 
//         automatic_approval : list.dataValues.automatic_approval,
//         chain_id : list.dataValues.chain_id,
//         limit_min: list.dataValues.limit_min,
//         limit_max: list.dataValues.limit_max,
//         margin_type: list.dataValues.margin_type,
//         margin: list.dataValues.margin,
//         status: list.dataValues.status,
//         terms: list.dataValues.terms,
//         token: list.dataValues.token_id,
//         banks: banks,
//         total_available_amount: list.dataValues.total_available_amount,
//         type: list.dataValues.type,
//         deposit_time_limit : list.dataValues.deposit_time_limit,
//         payment_time_limit: list.dataValues.payment_time_limit,
//         accept_only_verified: list.dataValues.accept_only_verified,
//         escrow_type : list.dataValues == 0 ? 'manual' : 'instant',
//         price_source : priceSourceMethod.priceSourceFunction(list.dataValues.price_source),
//         fiat_currency: fiatCurrencyData,
//         token : tokenData,
//         payment_methods: paymentMethodsData,
//         seller: userData,
//       } 
//       console.log("response", response)