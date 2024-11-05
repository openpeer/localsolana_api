// services/knockService.js
const knock = require('../utils/knock');

async function identifyUser(userId, userData) {
  try {
    const user = await knock.users.identify(userId, userData);
    console.log('User identified in Knock:', user);
    return user;
  } catch (error) {
    console.error('Error identifying user:', error);
    throw error;
  }
}

module.exports = { identifyUser };
