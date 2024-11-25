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
    // Allow both "Bearer <token>" and plain token format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : authHeader;
    
    if (!token) {
      return res.status(401).send('Invalid auth format');
    }

    // Verify HMAC signature
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    console.log('Expected signature:', signature);
    console.log('Received token:', token);

    if (token !== signature) {
      console.log('Signature mismatch');
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