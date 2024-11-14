const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class TalkjsUserService {
  constructor() {
    this.appId = process.env.TALKJS_APP_ID;
    this.secretKey = process.env.TALKJS_SECRET_KEY;
    if (!this.appId || !this.secretKey) {
      throw new Error("TALKJS_APP_ID or TALKJS_SECRET_KEY not set");
    }
    this.baseUrl = `https://api.talkjs.com/v1/${this.appId}`;
  }

  generateToken() {
    const payload = {
      tokenType: 'app',
      iss: this.appId,
      exp: Math.floor(Date.now() / 1000) + 30 // expiry time in seconds from now
    };
    return jwt.sign(payload, this.secretKey, { algorithm: 'HS256' });
  }

  async listUsers(limit = 100, startingAfter = null, isOnline = null) {
    const token = this.generateToken();
    const queryParams = {
      limit: limit
    };
    if (startingAfter) queryParams.startingAfter = startingAfter;
    if (isOnline !== null) queryParams.isOnline = isOnline;

    const url = `${this.baseUrl}/users`;
    console.log(`\nDebug: Request details\nURL: ${url}\nToken: ${token.substring(0, 20)}...\nApp ID: ${this.appId}`);

    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        params: queryParams
      });

      console.log(`Response Status: ${response.status}`);
      console.log(`Response Body: ${JSON.stringify(response.data).substring(0, 200)}...`);

      return {
        data: response.data.data,
        next_page_cursor: this.getNextPageCursor(response.data.data, limit)
      };
    } catch (error) {
      console.error(`Failed to fetch users: ${error.response ? error.response.data : error.message}`);
      throw new Error(`Failed to fetch users: ${error.response ? error.response.data : error.message}`);
    }
  }

  getNextPageCursor(data, limit) {
    if (!data || data.length < limit) return null;
    return data[data.length - 1].id;
  }
}

(async () => {
  try {
    const service = new TalkjsUserService();
    const result = await service.listUsers();
    console.log("Users:", result.data);
    console.log("Next Page Cursor:", result.next_page_cursor);
  } catch (error) {
    console.error("Error:", error.message);
  }
})();