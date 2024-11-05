require('dotenv').config()
const { Connection, PublicKey } = require("@solana/web3.js");
const coder = require("@coral-xyz/anchor/dist/cjs/coder");
const idl = require("../idl/local_solana_migrate.json");
// Database connection check
const { updateOrderSilently } = require("../controllers/orders.controller");
const NotificationWorker = require("../workers/notificationWorker");



exports.startListeningSolanaEvents = function (io) {
  const connection = new Connection(`${process.env.SOLANA_RPC_URL}`);
  const programId = new PublicKey(
   `${process.env.LOCALSOLANA_PROGRAM_ID}`
  );
  console.log("Here server is listening solana program events:");
  // Create a coder instance from your IDL
  const eventCoder = new coder.BorshEventCoder(idl);
  connection.onLogs(
    programId,
    (logs, context) => {
      logs.logs.forEach((log) => {
        handleProgramLog(log);
      });
    },
    "processed"
  );

  const handleProgramLog = async (log, errorOnDecodeFailure = true) => {
    const PROGRAM_DATA = "Program data:";
    const PROGRAM_DATA_START_INDEX = PROGRAM_DATA.length;

    // Check if the log is from this program (msg! or sol_log_data)
    if (log.startsWith(PROGRAM_DATA)) {
      const logStr = log.slice(PROGRAM_DATA_START_INDEX);

      // Decode the log string into an event using the coder
      const event = eventCoder.decode(logStr);
      console.log('Event Captured',event);
      if (errorOnDecodeFailure && event === null) {
        throw new Error(`Unable to decode event ${logStr}`);
      }
      console.log("Event Captured", event);
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
      if(status){
        await updateOrderSilently(event.data.order_id,status,io);
        console.log('Order Updated Silently',event.data.order_id,status);
      }
      if(notificationType){
        await new NotificationWorker().perform(notificationType,event.data.order_id);
        console.log('Notification Sent',notificationType);
      }
    }
    // } else {
    //   console.log("Log Captured", log);
    // }
  };
};
