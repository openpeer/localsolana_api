// api/routes/routes.js

const express = require('express');
const adminController = require('../../controllers/admin.controller');
const userController = require('../../controllers/user.controller');
const settingsController = require('../../controllers/settings.controller');
const ordersController = require('../../controllers/orders.controller');
const disputesController = require('../../controllers/disputes.controller');
const fiatController = require('../../controllers/fiatCurrencies.controller');
const listController = require('../../controllers/lists');

const tokenController = require('../../controllers/tokens.controller');
const loginController = require('../../controllers/login.controller');
const bankController = require('../../controllers/banks.controller');
const paymentMethods = require('../../controllers/paymentMethods.controller');
const pricesController = require('../../controllers/prices.controller');
const quickBuyController = require('../../controllers/quickBuy.controller');
const telegramController = require('../../controllers/telegram.controller');
const shyftController = require('../../controllers/shyft.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware'); // Correct import
const webhookAuthMiddleware = require('../../middleware/webhookAuth');
const { debugMiddleware } = require('../../middleware/webhookDebug');
const { handleHeliusWebhook } = require('../../utils/web3Utils');

const createRouter = (io) => {
    const router = express.Router();

    // Admin routes
    router.post('/admin/users', adminController.createAdminUser);
    router.get('/admin/users', adminController.getadminUsers);
    router.get('/admin/users/:id', adminController.getAdminUser);
    router.put('/admin/users/:id', adminController.updateAdminUser);
    router.delete('/admin/users/:id', adminController.deleteAdminUser);

    // User routes
    router.post('/users', userController.createUser);
    router.get('/usersCount', userController.getUsersCount);
    router.get('/getUsers', userController.getAllUsers);
    router.get('/user_profiles/:address', userController.getUser);
    router.patch('/user_profiles/:address', userController.updateUser);
    router.post('/user_profiles/:address', userController.updateUser);
    router.post('/login', loginController.login);
    router.get('/getParticularUser/:id', userController.getParticularUser);

    // Routes for admin settings
    router.post('/admin/settings', settingsController.createAdminSettings);
    router.get('/admin/settings', settingsController.getadminSettings);
    router.get('/admin/settings/:id', settingsController.getAdminSetting);
    router.post('/admin/settings/:id', settingsController.updateAdminSetting);
    router.delete('/admin/settings/:id', settingsController.deleteAdminSetting);

    // Routes for the Order
    router.get('/getOrders',authenticateToken, ordersController.getAllOrders);
    router.get('/orders/:id', authenticateToken, ordersController.getParticularOrder);
    router.get('/filterOrderByFilter', ordersController.fetchDataByFilters);
    router.post('/orders/:id/cancel',authenticateToken, (req, res) => ordersController.cancelOrder(req, res, io));
    router.post('/createOrder', authenticateToken, ordersController.createOrder);
    router.post('/updateOrder', authenticateToken,(req, res) => ordersController.updateOrder(req, res, io));
    router.post('/updateTrade', authenticateToken,ordersController.updateTrade);
    router.get('/ordersStatus', authenticateToken, ordersController.fetchDatathroughStatus);

    // Routes for the Disputes section
    router.post('/orders/:id/disputes', authenticateToken, (req, res) => disputesController.createDispute(req, res, io));
    router.get('/getDisputes', disputesController.getAllDisputes);
    router.get('/getParticularDispute/:id', disputesController.getParticularDispute);
    router.get('/filterDisputes', disputesController.fetchDataByFiltersDispute);
    router.post('/updateDispute', disputesController.updateDispute);

    // Routes for fiat currencies
    router.post('/createFiatCurrency', fiatController.createFiatCurrencies);
    router.get('/fiatCurrencies', fiatController.getFiatCurrencies);
    router.get('/fiatCurrency/:id', fiatController.getFiatCurrency);
    router.post('/updateFiatCurrency/:id', fiatController.updateFiatCurrencies);
    router.post('/deleteFiatCurrency/:id', fiatController.deleteFiatCurrency);

    // Routes for the Lists
    router.post('/createList', authenticateToken, listController.createList);
    router.get('/getLists', listController.getAllLists);
    router.get('/lists/ads',authenticateToken, listController.fetchMyAds);
    router.get('/lists/:id', listController.getList);
    router.get('/getListsCount', listController.getListsCount);
    router.put('/list_management/:id',authenticateToken, (req, res) =>listController.updateList(req, res));
    router.patch('/list_management/:id',authenticateToken, listController.updateListStatus);
    router.delete('/list_management/:id',authenticateToken, listController.deleteList);
    router.get('/lists', listController.fetchListForParticularUser);

    // Routes for tokens
    router.post('/admin/tokens', tokenController.createToken);
    router.get('/admin/tokens', tokenController.getadminTokens);
    router.get('/admin/tokens/:id', tokenController.getAdminToken);
    router.post('/admin/token/:id', tokenController.updateAdminToken);
    router.delete('/admin/token/:id', tokenController.deleteAdminToken);

    // Routes for the login functionality
    router.post('/login', loginController.login);

    // Routes for the banks
    router.post('/createBanks', bankController.createBanks);
    router.get('/getbanks', bankController.getbanks);
    router.get('/banks', bankController.getBanksByCurrency);

    // Routes for payment methods
    router.get('/getPaymentMethods/:id', paymentMethods.getPaymentMethods);
    router.get('/prices', pricesController.fetchData);

    // inspect the cache
    router.get('/prices/cache/inspect', pricesController.inspectCache);

    // Add this new route for getting specific pair prices
    router.get('/prices/price/:token/:fiat', pricesController.getPairPrice);

    router.get('/quickBuy', quickBuyController.quickBuy);

    //Routes for transaction
    router.post('/transaction',authenticateToken,  ordersController.handleTransaction);

    // Telegram webhook
    router.post('/telegram/webhook', telegramController.webhook);
    
    // Solana webhook with authentication
    router.post('/solana/webhook',
        debugMiddleware,
      webhookAuthMiddleware,
      async (req, res) => {
        try {
        console.log("Processing webhook after auth:", JSON.stringify(req.body, null, 2));
          await handleHeliusWebhook(req, res);
        } catch (error) {
          console.error("Error handling webhook:", error);
          res.status(500).send("Internal Server Error");
        }
      }
    );

    // transaction processing via shyft
    router.post('/processTransaction',authenticateToken, shyftController.processTransaction);
    return router;
}

module.exports = createRouter;