const debugWebhookRequest = async (req) => {
  // Log full request details
  const requestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]', // Mask the authorization token in logs
    },
    body: req.body,
  };

  console.log('Webhook Request Details:', JSON.stringify(requestLog, null, 2));

  // Fetch the secret and authorization header from the request
  const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;
  const authHeader = req.headers.authorization;

  // Validate that the required components are present
  if (!authHeader || !webhookSecret) {
    console.log('❌ Missing authentication components:');
    console.log('  Auth Header:', authHeader ? '✓' : '✗');
    console.log('  Webhook Secret:', webhookSecret ? '✓' : '✗');
    return false;
  }

  try {
    // Extract the token from the Authorization header
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    console.log('🔐 Simple Secret Validation:');
    console.log('  Expected Secret:', webhookSecret);
    console.log('  Received Token:', token);
    console.log('  Match:', webhookSecret === token ? '✓' : '✗');

    // If the request body contains events, log the details
    if (Array.isArray(req.body)) {
      console.log('\n📦 Parsed Events:');
      req.body.forEach((event, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log('  Transaction:', event.signature);
        console.log('  Type:', event.type);
        console.log('  Timestamp:', new Date(event.timestamp * 1000).toISOString());

        if (event.logs) {
          console.log('  Program Logs:');
          event.logs.forEach((log) => console.log(`    ${log}`));
        }
      });
    }

    // Return whether the token matches the secret
    return webhookSecret === token;
  } catch (error) {
    console.error('❌ Verification Error:', error);
    return false;
  }
};

// Export the debug request function and middleware
module.exports = {
  debugWebhookRequest,
  debugMiddleware: (req, res, next) => {
    debugWebhookRequest(req)
      .then((isValid) => {
        console.log('\n✨ Webhook validation result:', isValid ? 'VALID' : 'INVALID');
        next();
      })
      .catch((error) => {
        console.error('❌ Debug middleware error:', error);
        next();
      });
  },
};
