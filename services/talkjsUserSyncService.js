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
    // Convert ID to string to ensure consistency
    const talkjsUserId = String(user.id);
    const url = `${this.baseUrl}/users/${talkjsUserId}`;
    const payload = this.userPayload(user);
  
    console.log(`Syncing user ${talkjsUserId} with payload:`, payload);
  
    try {
      const response = await axios.put(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // If user doesn't exist, create a new one
        const createResponse = await axios.post(`${this.baseUrl}/users`, {
          id: talkjsUserId,
          ...payload
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return createResponse.data;
      }
      throw error;
    }
  }

  userPayload(user) {
    const payload = {
      name: user.name || 'Anonymous',
      email: user.email ? [user.email] : [],
      role: 'user',
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
      exp: Math.floor(Date.now() / 1000) + 300,
    };

    return jwt.sign(payload, this.secretKey, { algorithm: 'HS256' });
  }
}

module.exports = TalkjsUserSyncService;
