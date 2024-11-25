// scripts/getHeliusWebHooks.js

require('dotenv').config();
const fetch = require('node-fetch');

const testWebhookSetup = async () => {
  try {
    const apiKey = process.env.HELIUS_API_KEY;
    const webhookUrl = process.env.HELIUS_WEBHOOK_URL;
    const programId = process.env.LOCALSOLANA_PROGRAM_ID;

    if (!apiKey) {
      throw new Error('HELIUS_API_KEY not found in environment variables');
    }
    
    console.log('🔍 Checking Helius webhooks configuration...');
    console.log(`📍 Looking for webhook URL: ${webhookUrl || '[NOT SET]'}`);
    console.log(`🎯 Program ID: ${programId || '[NOT SET]'}\n`);
    
    const response = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const webhooks = await response.json();
    
    console.log("📋 All registered webhooks:");
    console.log(JSON.stringify(webhooks, null, 2));
    
    if (webhookUrl) {
      const ourWebhook = webhooks.find(w => w.webhookURL === webhookUrl);
      
      console.log('\n🎯 Our webhook configuration:');
      if (ourWebhook) {
        console.log(JSON.stringify(ourWebhook, null, 2));
        console.log('\n✅ Webhook is properly registered!');
        
        // Additional validations
        console.log('\n🔍 Validation checks:');
        console.log(`- Webhook ID: ${ourWebhook.webhookID ? '✅' : '❌'}`);
        console.log(`- Account addresses include program ID: ${
          ourWebhook.accountAddresses?.includes(programId) ? '✅' : '❌'
        }`);
        console.log(`- Enhanced webhook type: ${
          ourWebhook.webhookType === 'enhanced' ? '✅' : '❌'
        }`);
      } else {
        console.log('\n⚠️  Warning: Webhook URL not found in registered webhooks!');
      }
    }
  } catch (error) {
    console.error('\n❌ Error checking webhooks:', error.message);
    process.exit(1);
  }
};

// Execute the function
console.log('🚀 Starting Helius webhook verification...\n');
testWebhookSetup()
  .then(() => {
    console.log('\n✨ Webhook verification complete');
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });