// utils/web3Utils.js

require("dotenv").config();
const { PublicKey } = require("@solana/web3.js");
const coder = require("@coral-xyz/anchor/dist/cjs/coder");
const idl = require("../idl/local_solana_migrate.json");
const { updateOrderSilently } = require("../controllers/orders.controller");
const NotificationWorker = require("../workers/notificationWorker");
const fetch = require('node-fetch');

const setupWebhook = async (apiKey, programId, webhookUrl) => {
  try {
    const checkResponse = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`);
    if (!checkResponse.ok) throw new Error(await checkResponse.text());

    const existingWebhooks = await checkResponse.json();
    const existing = existingWebhooks.find(w =>
      w.webhookURL === webhookUrl && w.accountAddresses.includes(programId)
    );

    if (existing) {
      console.log(`Using existing webhook: ${existing.webhookID}`);
      return existing;
    }

    const response = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookURL: webhookUrl,
        accountAddresses: [programId],
        webhookType: 'enhanced',
        transactionTypes: ['Any'],
        authHeader: `Bearer ${process.env.HELIUS_WEBHOOK_SECRET}`,
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    const webhookData = await response.json();
    console.log('✅ Webhook set up successfully:', webhookData);
    return webhookData;
  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
    throw error;
  }
};

exports.startListeningSolanaEvents = async function (io) {
  const apiKey = process.env.HELIUS_API_KEY;
  const programId = new PublicKey(process.env.LOCALSOLANA_PROGRAM_ID);

  console.log("Initializing Solana program event monitoring via Helius...");

  const webhookUrl = process.env.HELIUS_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("HELIUS_WEBHOOK_URL not configured");

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

  if (!logs || !Array.isArray(logs)) {
    console.error("Invalid logs format:", logs);
    return res.status(400).send("Invalid log format");
  }

  for (const logObj of logs) {
    try {
      if (!logObj.logs || !Array.isArray(logObj.logs)) {
        console.error("logObj.logs is not iterable or missing:", JSON.stringify(logObj, null, 2));
        continue; // Skip invalid log objects
      }

      for (const logStr of logObj.logs) {
        const PROGRAM_DATA = "Program data:";
        if (!logStr.includes(PROGRAM_DATA)) continue;

        const programDataStr = logStr.slice(logStr.indexOf(PROGRAM_DATA) + PROGRAM_DATA.length).trim();
        let event;

        try {
          event = eventCoder.decode(programDataStr);
        } catch (decodeError) {
          console.error("Failed to decode event:", programDataStr, decodeError);
          continue;
        }

        if (!event) {
          console.error("No event decoded from:", programDataStr);
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
          default:
            console.log("Unhandled event type:", event.name);
        }

        if (status) {
          try {
            await updateOrderSilently(event.data.order_id, status, io);
            console.log("Order Updated:", event.data.order_id, status);
          } catch (updateError) {
            console.error("Error updating order:", event.data.order_id, updateError);
          }
        }

        if (notificationType) {
          try {
            await new NotificationWorker().perform(notificationType, event.data.order_id);
            console.log("Notification Sent:", notificationType);
          } catch (notificationError) {
            console.error("Error sending notification:", notificationType, notificationError);
          }
        }
      }
    } catch (error) {
      console.error("Error processing logObj:", JSON.stringify(logObj, null, 2), error);
    }
  }

  res.status(200).send("Logs processed successfully");
};
