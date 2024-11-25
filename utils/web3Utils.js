// utils/web3Utils.js

require("dotenv").config();
const { PublicKey } = require("@solana/web3.js");
const coder = require("@coral-xyz/anchor/dist/cjs/coder");
const idl = require("../idl/local_solana_migrate.json");
const { updateOrderSilently } = require("../controllers/orders.controller");
const NotificationWorker = require("../workers/notificationWorker");
const { Helius } = require("helius-sdk");
const fetch = require('node-fetch');

const setupWebhook = async (apiKey, programId, webhookUrl) => {
  // First, check existing webhooks
  const checkResponse = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`);
  
  if (!checkResponse.ok) {
    const error = await checkResponse.text();
    console.error('❌ Failed to fetch existing webhooks:', error);
    throw new Error(error);
  }

  const existingWebhooks = await checkResponse.json();
  
  const existing = existingWebhooks.find(w => 
    w.webhookURL === webhookUrl && 
    w.accountAddresses.includes(programId)
  );

  if (existing) {
    console.log(`Using existing webhook: ${existing.webhookID}`);
    return existing;
  }

  // Create a new webhook if none exists
  const response = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webhookURL: webhookUrl,
      accountAddresses: [programId],
      webhookType: 'enhanced',
      transactionTypes: ['Any'],
      authHeader: `Bearer ${process.env.HELIUS_WEBHOOK_SECRET}`, // Use Bearer prefix here
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to set up webhook:', error);
    throw new Error(error);
  }

  const webhookData = await response.json();
  console.log('✅ Webhook set up successfully:', webhookData);
  return webhookData;
};

exports.startListeningSolanaEvents = async function (io) {
  const apiKey = process.env.HELIUS_API_KEY;
  const programId = new PublicKey(process.env.LOCALSOLANA_PROGRAM_ID);

  console.log("Initializing Solana program event monitoring via Helius...");

  const webhookUrl = process.env.HELIUS_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("HELIUS_WEBHOOK_URL not configured");
  }

  try {
    const webhook = await setupWebhook(apiKey, programId.toBase58(), webhookUrl);
    console.log(`Helius webhook configured successfully. ID: ${webhook.webhookID}`);
  } catch (error) {
    console.error("Failed to initialize Helius webhook:", error);
    throw error;
  }
};

exports.handleHeliusWebhook = async (req, res) => {
  const eventCoder = new coder.BorshEventCoder(idl);
  const logs = req.body;

  // Validate logs format at the beginning
  if (!logs || !Array.isArray(logs)) {
    console.error("Invalid logs format:", logs);
    return res.status(400).send("Invalid log format");
  }

  for (const logObj of logs) {
    try {
      // Check if logs field exists and is an array
      if (!logObj.logs || !Array.isArray(logObj.logs)) {
        console.error("logObj.logs is not iterable or missing:", logObj);
        continue; // Skip this logObj and move to the next
      }

      for (const logStr of logObj.logs) {
        const PROGRAM_DATA = "Program data:";
        if (!logStr.includes(PROGRAM_DATA)) continue;

        const programDataStr = logStr.slice(logStr.indexOf(PROGRAM_DATA) + PROGRAM_DATA.length).trim();
        const event = eventCoder.decode(programDataStr);

        if (!event) {
          console.error("Failed to decode event:", programDataStr);
          continue;
        }

        console.log("Event Captured:", event);

        let status;
        let notificationType;

        switch (event.name) {
          case "EscrowCreated":
            status = 1;
            notificationType = NotificationWorker.SELLER_ESCROWED;
            break;
          case "SellerCancelDisabled":
            status = 2;
            notificationType = NotificationWorker.BUYER_PAID;
            break;
          case "Released":
            status = 5;
            notificationType = NotificationWorker.SELLER_RELEASED;
            break;
          case "DisputeOpened":
            status = 4;
            notificationType = NotificationWorker.DISPUTE_OPENED;
            break;
          case "DisputeResolved":
            status = 2;
            notificationType = NotificationWorker.DISPUTE_RESOLVED;
            break;
        }

        if (status) {
          await updateOrderSilently(event.data.order_id, status, io);
          console.log("Order Updated:", event.data.order_id, status);
        }

        if (notificationType) {
          await new NotificationWorker().perform(notificationType, event.data.order_id);
          console.log("Notification Sent:", notificationType);
        }
      }
    } catch (error) {
      console.error("Error processing logObj:", error, logObj);
    }
  }

  res.status(200).send("Logs processed successfully");
};

