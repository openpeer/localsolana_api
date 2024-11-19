const jwt = require('jsonwebtoken');
const axios = require('axios');
const { user: User } = require('../models'); // Adjust the path as necessary
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file

// Load the production configuration
const config = require('../config/config.js').production;

// Create a new Sequelize instance using the production configuration
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: console.log, // enable logging to see SQL queries
});

class TalkjsUserSyncService {
  constructor(dryRun = false) {
    this.appId = process.env.TALKJS_APP_ID;
    this.secretKey = process.env.TALKJS_SECRET_KEY;
    this.baseUrl = `https://api.talkjs.com/v1/${this.appId}`;
    this.dryRun = dryRun;
    console.log('TalkjsUserSyncService initialized with App ID:', this.appId);
  }

  generateToken() {
    const payload = {
      tokenType: 'app',
      iss: this.appId,
      exp: Math.floor(Date.now() / 1000) + 30
    };
    const token = jwt.sign(payload, this.secretKey, { algorithm: 'HS256' });
    console.log('Generated JWT token for TalkJS:', token);
    return token;
  }

  userPayload(user) {
    const email = Array.isArray(user.email)
      ? user.email
      : user.email
      ? [user.email]
      : null;

    const payload = {
      name: user.name,
      email: email,
      photoUrl: user.image_url ? `${process.env.PROFILE_IMAGES_BASE_URL}/${user.image_url}` : null, // Mapped from 'image_url'
      role: 'user' // Hardcoded to 'user'
    };
    console.log(`Constructed payload for user ID ${user.id}:`, payload);
    return payload;
  }

  async syncUser(user) {
    console.log(`Starting sync for user ID ${user.id}`);
    const payload = this.userPayload(user);

    if (this.dryRun) {
      console.log(`Dry-run: Skipping API call for user ID ${user.id}`);
      return;
    }

    const token = this.generateToken();
    const url = `${this.baseUrl}/users/${user.id}`;
    try {
      const response = await axios.put(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`Successfully synced user ID ${user.id}:`, response.data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn(`User ID ${user.id} not found on TalkJS. Attempting to create.`);
        try {
          const createResponse = await axios.post(`${this.baseUrl}/users`, payload, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          console.log(`Successfully created user ID ${user.id} on TalkJS:`, createResponse.data);
          return createResponse.data;
        } catch (createError) {
          console.error(`Failed to create user ID ${user.id}:`, createError.response?.data);
          throw new Error(`Failed to create user ID ${user.id}: ${JSON.stringify(createError.response?.data)}`);
        }
      } else {
        console.error(`Failed to sync user ID ${user.id}:`, error.response?.data);
        throw new Error(`Failed to sync user ID ${user.id}: ${JSON.stringify(error.response?.data)}`);
      }
    }
  }
}

module.exports = TalkjsUserSyncService;

// Main Execution Logic
(async () => {
  try {
    console.log('Script started.');

    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');

    if (isDryRun) {
      console.log('Running in dry-run mode. No API calls will be made.');
    }

    const syncService = new TalkjsUserSyncService(isDryRun);

    await sequelize.authenticate();
    console.log('Database connection established.');

    const users = await User.findAll({
      where: {
        // Add any filtering criteria if needed
      },
      attributes: ['id', 'name', 'email', 'image_url'], // Ensure 'image_url' is included
    });

    console.log(`Found ${users.length} user(s) to sync.`);

    for (const user of users) {
      await syncService.syncUser(user);
    }

    console.log('User sync process completed.');
  } catch (error) {
    console.error('An error occurred during the sync process:', error.message);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('Database connection closed.');
    }
  }
})();