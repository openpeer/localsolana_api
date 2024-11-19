const axios = require('axios');
const jwt = require('jsonwebtoken');

class TalkjsUserSyncService {
  constructor() {
    this.appId = process.env.TALKJS_APP_ID;
    if (!this.appId) throw new Error('TALKJS_APP_ID not configured');
    
    this.secretKey = process.env.TALKJS_SECRET_KEY;
    if (!this.secretKey) throw new Error('TALKJS_SECRET_KEY not configured');
    
    this.baseUrl = `https://api.talkjs.com/v1/${this.appId}`;
  }

  // Sync a single user
  async syncUser(user) {
    const token = this.generateToken();
    const userId = String(user.id);
    const url = `${this.baseUrl}/users/${userId}`;
    const payload = this.userPayload(user);

    try {
      const response = await axios.put(url, payload, {
        headers: this.getHeaders(token)
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return this.createUser(user, token);
      }
      throw new Error(`Failed to sync user ${userId}: ${error.message}`);
    }
  }

  // Batch sync multiple users
  async batchSyncUsers(users) {
    const token = this.generateToken();
    const payload = users.reduce((acc, user) => {
      acc[String(user.id)] = this.userPayload(user);
      return acc;
    }, {});

    try {
      const response = await axios.put(
        `${this.baseUrl}/users`,
        payload,
        { headers: this.getHeaders(token) }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to batch sync users: ${error.message}`);
    }
  }

  // Sync all users in batches
  async syncAllUsers(batchSize = 100) {
    try {
      const users = await models.user.findAll();
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        await this.batchSyncUsers(batch);
      }
    } catch (error) {
      throw new Error(`Failed to sync all users: ${error.message}`);
    }
  }

  // Private methods
  async createUser(user, token) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/users`, 
        { id: String(user.id), ...this.userPayload(user) },
        { headers: this.getHeaders(token) }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create user ${user.id}: ${error.message}`);
    }
  }

  userPayload(user) {
    const payload = {
      name: user.name || 'Anonymous',
      email: user.email ? [user.email] : [],
      role: 'user'
    };

    if (user.image_url) {
      payload.photoUrl = `${process.env.PROFILE_IMAGES_BASE_URL}/${user.image_url}`;
    }

    return payload;
  }

  generateToken() {
    const payload = {
      tokenType: 'app',
      iss: this.appId,
      exp: Math.floor(Date.now() / 1000) + 30
    };
    return jwt.sign(payload, this.secretKey, { algorithm: 'HS256' });
  }

  getHeaders(token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
}

module.exports = TalkjsUserSyncService;