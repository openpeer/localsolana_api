// middleware/webhookAuth.js

const crypto = require('crypto');

const webhookAuthMiddleware = (req, res, next) => {
  console.log("Received webhook with body:", JSON.stringify(req.body, null, 2));
  console.log("Auth header:", req.headers.authorization);

  const authHeader = req.headers.authorization;
  const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;

  if (!authHeader || !webhookSecret) {
    console.log("Missing auth header or webhook secret");
    return res.status(401).send('Missing authentication');
  }

  try {
    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).send('Invalid auth format');
    }

    // Verify HMAC signature
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (token !== signature) {
      return res.status(401).send('Invalid signature');
    }

    next();
  } catch (error) {
    console.error('Webhook auth error:', error);
    console.log("Auth error details:", error);
    return res.status(401).send('Authentication failed');
  }
};

module.exports = webhookAuthMiddleware;