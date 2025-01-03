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
        color: bank.dataValues.color,
        account_info_schema: bank.dataValues.account_info_schema || [],
        image: bank.dataValues.image,
        imageUrl: bank.dataValues.image ? 
          `${process.env.BANK_IMAGES_BASE_URL}/${bank.dataValues.image}` : 
          null
      });
    }
  }
  return banksData;
}

async function fetchPaymentMethods(listId) {
  try {
    const paymentMethodIds = await models.lists_payment_methods.findAll({
      attributes: ['payment_method_id'],
      where: { list_id: listId }
    });
    
    const paymentMethods = [];
    for (const item of paymentMethodIds) {
      const method = await models.payment_methods.findByPk(item.payment_method_id);
      
      if (method && method.dataValues.bank_id) {
        const bank = await models.banks.findByPk(method.dataValues.bank_id);
        
        if (bank) {
          console.log('Found payment method:', method.dataValues);
          paymentMethods.push({
            id: bank.dataValues.id,
            name: bank.dataValues.name,
            color: bank.dataValues.color,
            account_info_schema: bank.dataValues.account_info_schema || [],
            image: bank.dataValues.image,
            imageUrl: bank.dataValues.image ? 
              `${process.env.BANK_IMAGES_BASE_URL}/${bank.dataValues.image}` : 
              null,
            values: method.dataValues.values
          });
        }
      }
    }
    
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
    // For SellLists, get bank IDs from payment methods
    if (list.dataValues.type === "SellList" && !bankIds) {
      const paymentMethodIds = await models.lists_payment_methods.findAll({
        attributes: ['payment_method_id'],
        where: { list_id: list.dataValues.id }
      });
      
      const bankIdsFromPaymentMethods = [];
      for (const item of paymentMethodIds) {
        const method = await models.payment_methods.findByPk(item.payment_method_id);
        if (method && method.dataValues.bank_id) {
          bankIdsFromPaymentMethods.push(method.dataValues.bank_id);
        }
      }
      bankIds = bankIdsFromPaymentMethods;
    }

    const banksData = await fetchBanksData(bankIds);
    
    const fiatCurrency = list.dataValues.fiat_currency_id ? 
      await models.fiat_currencies.findByPk(list.dataValues.fiat_currency_id) : null;
    
    const token = list.dataValues.token_id ? 
      await models.tokens.findByPk(list.dataValues.token_id) : null;

    const userData = await fetchUserData(list.dataValues.seller_id, list.dataValues.chain_id);
    if (!userData) return null;

    const calculatedPrice = await calculateListingPrice(list.dataValues, fiatCurrency, token);
    if (!calculatedPrice) {
      console.error(`Failed to calculate price for list ${list.dataValues.id}. Price source: ${list.dataValues.price_source}`);
    }

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
      limit_min: list.dataValues.limit_min !== undefined ? list.dataValues.limit_min : null,
      limit_max: list.dataValues.limit_max !== undefined ? list.dataValues.limit_max : null,
      deposit_time_limit: list.dataValues.deposit_time_limit,
      payment_time_limit: list.dataValues.payment_time_limit,
      terms: list.dataValues.terms,
      chain_id: list.dataValues.chain_id,
      accept_only_verified: list.dataValues.accept_only_verified,
      escrow_type: list.dataValues.escrow_type,
      price_source: list.dataValues.price_source,
      calculatedPrice: calculatedPrice || 'N/A',
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