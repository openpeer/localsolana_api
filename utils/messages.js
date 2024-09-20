/* -----------------------------------------------------------------------
   * @ description : Main module to include all the messages used in project.
----------------------------------------------------------------------- */

const { paymentMethods } = require("../controllers/paymentMethods.controller");

module.exports = {
    accept: 'Accepted',
    confirm: 'Confirmed',
    say: function (text) {
        return `${text}`;
    },
    systemError: 'Technical error ! Please try again later.',
    registerSuccess: 'Your account has been registered successfully.',
    tokenExpired: 'Session Expired.',
    success: 'Success',
    emailAlreadyExist: 'User with this email already exists',
    emailNotExist: 'Name and Password is not correct',
    userAdded: 'User Created',
    getAllUsers: 'Users has been fetched', 
    userAlreadyRegistered: `This user is already registered`,
    usernotFound: 'User not found', 
    userUpdated: 'User has been updated successfully', 
    userDeleted: 'User has been deleted successfully',
    getAdminSettings: 'Admin Settings has been fetched successfully',
    settingUpdated: 'Setting has been updated successfully',
    deletedSuccessfully:'Deleted Successfully',
    orderNotFound: 'Order not found',
    disputeNotFound: 'Dispute not found',
    disputeUpdated: 'Dispute has been updated',
    getFiatCurrencies: 'Fiat Currencies has been fetched successfully',
    fiatCurrencyNotFound: 'Fiat Currency not found',
    getFiatCurrency: 'Fiat Currecncy has been fetched successfully',
    updateFiatCurrency: 'Fiat Currencies has been updated successfully',
    getAllLists: 'Lists has been fetched successfully',
    listNotFound: 'List not found',
    getList: 'List has been fetched successfully',
    getTokens: 'Tokens has been fetched successfully',
    tokenNotFound: 'Token not found',
    updateToken: 'Token has been updated successfully',
    invalidCredentials: 'Invalid credentials',
    updatedList: 'List has been updated successfully.',
    fetchedBanks: 'Banks has been fetched successfully',
    bankError: 'There is an error while generating the banks',
    adminSettingsNotFound: 'Admin settings not found',
    noBanksFound: 'No banks were found;',
    login: 'Login successful', 
    paymentMethods: 'Payment Methods has been fetched',
    noPaymentMethods : 'No Payment Methods has been found',
    noDataFound: 'No data found', 
    orderUpdated: 'Order has been updated successfully',
    orderCanceled: 'Order cannot be canceled'
};