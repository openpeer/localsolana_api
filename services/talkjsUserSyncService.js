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
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log(`User synced successfully: ${response.data}`);
    } catch (error) {
      console.error(`Failed to sync user ${user.id}:`, error.response?.data || error.message);
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
