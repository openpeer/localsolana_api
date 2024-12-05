// controllers/lists/shared/list-processing.js
const models = require('../../../models');
const { isOnline } = require('../../../utils/util');
const { calculateListingPrice } = require('./price-calculation');

async function fetchBanksData(bankIds) {
  const banksData = [];
  if (!bankIds) return banksData;

  for (let item of bankIds) {
    const bank = await models.banks.findByPk(item);
    if (bank) {
      banksData.push({
        id: bank.dataValues.id,
        name: bank.dataValues.name,
        color: bank.dataValues.color
      });
    }
  }
  return banksData;
}

async function fetchPaymentMethods(listId) {
  try {
    // Get payment method IDs
    const paymentMethodIds = await models.lists_payment_methods.findAll({
      attributes: ['payment_method_id'],
      where: { list_id: listId }
    });
    
    // DEBUG: Let's see what we're getting
    console.log('Payment Method IDs:', JSON.stringify(paymentMethodIds, null, 2));

    const paymentMethods = [];
    for (const item of paymentMethodIds) {
      // DEBUG: Log each item
      console.log('Processing payment method:', item.payment_method_id);
      
      const method = await models.payment_methods.findByPk(item.payment_method_id);
      console.log('Found method:', JSON.stringify(method?.dataValues, null, 2));
      
      if (method && method.dataValues.bank_id) {
        const bank = await models.banks.findByPk(method.dataValues.bank_id);
        console.log('Found bank:', JSON.stringify(bank?.dataValues, null, 2));
        
        if (bank) {
          paymentMethods.push({
            id: bank.dataValues.id,
            name: bank.dataValues.name,
            color: bank.dataValues.color
          });
        }
      }
    }
    
    console.log('Final payment methods:', JSON.stringify(paymentMethods, null, 2));
    return paymentMethods;
  } catch (error) {
    console.error('Error in fetchPaymentMethods:', error);
    return [];
  }
}

async function fetchUserData(sellerId, chainId) {
  const userData = await models.user.findByPk(sellerId);
  if (!userData) return null;

  const contracts = await models.contracts.findAll({
    where: {
      user_id: sellerId,
      chain_id: chainId,
    },
  });

  return {
    address: userData.dataValues.address,
    email: userData.dataValues.email,
    name: userData.dataValues.name,
    image_url: userData.dataValues.image_url,
    verified: userData.dataValues.verified,
    contracts: contracts,
    online: isOnline(
      userData.dataValues.timezone,
      userData.dataValues.available_from,
      userData.dataValues.available_to,
      userData.dataValues.weeekend_offline
    )
  };
}

exports.processListData = async function(list, bankIds = null) {
  try {
    const banksData = await fetchBanksData(bankIds);
    
    const fiatCurrency = list.dataValues.fiat_currency_id ? 
      await models.fiat_currencies.findByPk(list.dataValues.fiat_currency_id) : null;
    
    const token = list.dataValues.token_id ? 
      await models.tokens.findByPk(list.dataValues.token_id) : null;

    const userData = await fetchUserData(list.dataValues.seller_id, list.dataValues.chain_id);
    if (!userData) return null;

    const calculatedPrice = await calculateListingPrice(list.dataValues, fiatCurrency, token);

    // For BuyLists, use banks as payment methods
    const paymentMethods = list.dataValues.type === "BuyList" ? 
      banksData : 
      await fetchPaymentMethods(list.dataValues.id);

    return {
      id: list.dataValues.id,
      type: list.dataValues.type,
      status: list.dataValues.status,
      margin_type: list.dataValues.margin_type,
      margin: list.dataValues.margin,
      total_available_amount: list.dataValues.total_available_amount,
      limit_min: list.dataValues.limit_min,
      limit_max: list.dataValues.limit_max,
      deposit_time_limit: list.dataValues.deposit_time_limit,
      payment_time_limit: list.dataValues.payment_time_limit,
      terms: list.dataValues.terms,
      chain_id: list.dataValues.chain_id,
      accept_only_verified: list.dataValues.accept_only_verified,
      escrow_type: list.dataValues.escrow_type,
      price_source: list.dataValues.price_source,
      calculatedPrice: calculatedPrice || list.dataValues.margin,
      token,
      fiat_currency: fiatCurrency,
      seller: userData,
      banks: banksData,
      payment_methods: paymentMethods || []
    };
  } catch (error) {
    console.error('Error in processListData:', error);
    return null;
  }
};