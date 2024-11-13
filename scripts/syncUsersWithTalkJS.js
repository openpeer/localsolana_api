require('dotenv').config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const models = require('../models'); // Import existing models

// Use the existing Sequelize instance from models
const sequelize = models.sequelize;

// Use the existing User model
const User = models.user;

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
    // Ensure email is an array or null
    const email = Array.isArray(user.email)
      ? user.email
      : user.email
      ? [user.email]
      : null;

    const payload = {
      name: user.name,
      email: email,
      // photoUrl: user.photoUrl || '', // Mapped from 'image_url'
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
        // User not found, create them
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

    // Parse command-line arguments
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');

    if (isDryRun) {
      console.log('Running in dry-run mode. No API calls will be made.');
    }

    const syncService = new TalkjsUserSyncService(isDryRun);

    // Authenticate and connect to the database
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Fetch users from the database
    const users = await User.findAll({
      where: {
        // Add any filtering criteria if needed
      },
      attributes: ['id', 'name', 'email'], // Corrected aliasing
    });

    console.log(`Found ${users.length} user(s) to sync.`);

    for (const user of users) {
      await syncService.syncUser(user);
    }

    console.log('User sync process completed.');
  } catch (error) {
    console.error('An error occurred during the sync process:', error.message);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed.');
  }
})();