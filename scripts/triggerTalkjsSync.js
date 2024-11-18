const { Sequelize } = require('sequelize');
const { user: User } = require('../models'); // Adjust the path as necessary
const TalkjsUserSyncService = require('../services/talkjsUserSyncService');
require('dotenv').config(); // Load environment variables from .env file

// Load the production configuration
const config = require('../config/config.js').production;

// Create a new Sequelize instance using the production configuration
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: console.log, // enable logging to see SQL queries
});

(async () => {
  try {
    console.log('Script started.');

    // Get the new name from the CLI arguments
    const newName = process.argv[2];
    if (!newName) {
      console.error('Please provide a new name as an argument.');
      process.exit(1);
    }

    // Authenticate and connect to the database
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Fetch a test user from the database
    const testUserId = 1; // Replace with a valid user ID for testing
    const user = await User.findByPk(testUserId);

    if (!user) {
      console.error(`User with ID ${testUserId} not found.`);
      return;
    }

    console.log(`Fetched user: ${JSON.stringify(user.dataValues, null, 2)}`);

    // Update the user's name
    user.name = newName;
    await user.save();
    console.log(`Updated user name to: ${newName}`);

    // Instantiate the TalkjsUserSyncService
    const syncService = new TalkjsUserSyncService();

    // Sync the user with TalkJS
    const result = await syncService.syncUser(user);
    console.log('Sync result:', result);

  } catch (error) {
    console.error('An error occurred during the sync process:', error.message);
    console.error(error.stack);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('Database connection closed.');
    }
  }
})();