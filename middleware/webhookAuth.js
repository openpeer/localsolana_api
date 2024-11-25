// middleware/webhookAuth.js
const HELIUS_WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET;

const authenticateWebhook = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Ensure Authorization header exists
  if (!authHeader) {
    console.error('❌ Authorization header missing');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1] || authHeader;

  // Check token validity
  if (token !== HELIUS_WEBHOOK_SECRET) {
    console.error('❌ Invalid authorization token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('✅ Webhook authenticated successfully');
  next();
};

module.exports = authenticateWebhook;
