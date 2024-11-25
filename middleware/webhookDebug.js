// middleware/webhookDebug.js

const crypto = require('crypto');

const debugWebhookRequest = async (req) => {
  // Log full request details
  const requestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]'
    },
    body: req.body,
  };
  
  console.log('Webhook Request Details:', JSON.stringify(requestLog, null, 2));

  // Verify signature manually
  const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !webhookSecret) {
    console.log('❌ Missing authentication components:');
    console.log('  Auth Header:', authHeader ? '✓' : '✗');
    console.log('  Webhook Secret:', webhookSecret ? '✓' : '✗');
    return false;
  }

  try {
    const [bearer, token] = authHeader.split(' ');
    
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    const actualSignature = token;
    
    console.log('🔐 Signature Verification:');
    console.log('  Expected:', expectedSignature);
    console.log('  Received:', actualSignature);
    console.log('  Match:', expectedSignature === actualSignature ? '✓' : '✗');

    // Log parsed event details if present
    if (Array.isArray(req.body)) {
      console.log('\n📦 Parsed Events:');
      req.body.forEach((event, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log('  Transaction:', event.signature);
        console.log('  Type:', event.type);
        console.log('  Timestamp:', new Date(event.timestamp * 1000).toISOString());
        
        if (event.logs) {
          console.log('  Program Logs:');
          event.logs.forEach(log => console.log(`    ${log}`));
        }
      });
    }

    return expectedSignature === actualSignature;
  } catch (error) {
    console.error('❌ Verification Error:', error);
    return false;
  }
};

module.exports = {
  debugWebhookRequest,
  debugMiddleware: (req, res, next) => {
    debugWebhookRequest(req)
      .then(isValid => {
        console.log('\n✨ Webhook validation result:', isValid ? 'VALID' : 'INVALID');
        next();
      })
      .catch(error => {
        console.error('❌ Debug middleware error:', error);
        next();
      });
  }
};