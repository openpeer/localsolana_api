const axios = require('axios');
const jwt = require('jsonwebtoken');

class TalkjsUserSyncService {
  constructor() {
    this.appId = process.env.TALKJS_APP_ID;
    this.secretKey = process.env.TALKJS_SECRET_KEY;
    this.baseUrl = `https://api.talkjs.com/v1/${this.appId}`;
  }

  async syncUser(user) {
    const token = this.generateToken();
    const url = `${this.baseUrl}/users/${user.id}`;
    const payload = this.userPayload(user);

    console.log(`Constructed payload for user ID ${user.id}:`, payload);

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
      console.error(`Failed to sync user ${user.id}: ${error.response ? error.response.data : error.message}`);
      throw new Error(`Failed to sync user ${user.id}: ${error.response ? error.response.data : error.message}`);
    }
  }

  async batchSyncUsers(users) {
    const token = this.generateToken();
    const url = `${this.baseUrl}/users`;
    const payload = users.reduce((acc, user) => {
      acc[user.id.toString()] = this.userPayload(user);
      return acc;
    }, {});

    console.log(`Constructed batch payload for users:`, payload);

    try {
      const response = await axios.put(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`Successfully batch synced users:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to batch sync users: ${error.response ? error.response.data : error.message}`);
      throw new Error(`Failed to batch sync users: ${error.response ? error.response.data : error.message}`);
    }
  }

  async syncAllUsers(batchSize = 100) {
    const users = await models.user.findAll({ limit: batchSize });
    for (const user of users) {
      await this.syncUser(user);
    }
  }

  userPayload(user) {
    return {
      name: user.name,
      email: user.email ? [user.email] : [],
      photoUrl: user.image_url ? `${process.env.PROFILE_IMAGES_BASE_URL}/${user.image_url}` : '',
      role: 'user'
    };
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
}

module.exports = TalkjsUserSyncService;