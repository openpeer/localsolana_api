// utils/web3Utils.js

require("dotenv").config();
const { PublicKey } = require("@solana/web3.js");
const coder = require("@coral-xyz/anchor/dist/cjs/coder");
const idl = require("../idl/local_solana_migrate.json");
const { updateOrderSilently } = require("../controllers/orders.controller");
const NotificationWorker = require("../workers/notificationWorker");
const { Helius } = require("helius-sdk");

exports.startListeningSolanaEvents = function (io) {
  const helius = new Helius(process.env.HELIUS_API_KEY);
  const programId = new PublicKey(process.env.LOCALSOLANA_PROGRAM_ID);

  console.log("Server is now listening to Solana program events via Helius:");

  // Validate webhook URL
  const webhookUrl = process.env.HELIUS_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("HELIUS_WEBHOOK_URL is not configured in the environment");
  }

  // Register a Helius webhook for program logs
  helius
    .streamProgramLogs({
      programId: programId.toBase58(),
      webhookUrl: webhookUrl,
    })
    .then(() => {
      console.log(`Helius webhook successfully set up for program: ${programId.toBase58()}`);
    })
    .catch((error) => {
      console.error("Error setting up Helius webhook:", error.message);
    });
};

// Example webhook endpoint for handling logs (to be added in your server file)
exports.handleHeliusWebhook = async (req, res) => {
  const eventCoder = new coder.BorshEventCoder(idl);
  const logs = req.body; // Assuming logs are sent in the body of the request

  if (!logs || !Array.isArray(logs)) {
    res.status(400).send("Invalid log format");
    return;
  }

  for (const log of logs) {
    try {
      const PROGRAM_DATA = "Program data:";
      const PROGRAM_DATA_START_INDEX = PROGRAM_DATA.length;

      if (log.startsWith(PROGRAM_DATA)) {
        const logStr = log.slice(PROGRAM_DATA_START_INDEX);
        const event = eventCoder.decode(logStr);

        if (event) {
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
              break;
          }

          if (status) {
            await updateOrderSilently(event.data.order_id, status, io);
            console.log("Order Updated Silently:", event.data.order_id, status);
          }

          if (notificationType) {
            await new NotificationWorker().perform(notificationType, event.data.order_id);
            console.log("Notification Sent:", notificationType);
          }
        } else {
          console.error("Failed to decode event:", logStr);
        }
      }
    } catch (error) {
      console.error("Error processing log:", error);
    }
  }

  res.status(200).send("Logs processed successfully");
};
