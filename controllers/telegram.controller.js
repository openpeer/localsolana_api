const TelegramBot = require('node-telegram-bot-api');
const models = require('../models/index');
const { successResponse, errorResponse } = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { webHook: true });

exports.webhook = async (req, res) => {
  console.log("Received webhook request with params:", req.body);

  const message = req.body.message;

  if (message && message.text) {
    const chat_id = message.chat.id; // Define chat_id here
    if (message.text.startsWith('/start')) {
      const unique_identifier = extractUniqueIdentifier(message.text);
      console.log("Extracted unique identifier:", unique_identifier);

      if (unique_identifier) {
        const user = await models.user.findOne({ where: { unique_identifier } });
        console.log("User found:", user);

        if (user) {
          const username = message.from.username;
          console.log("Updating user with chat_id:", chat_id, "username:", username);

          const existingUser = await models.user.findOne({ where: { telegram_user_id: chat_id } });
          if (existingUser && existingUser.id !== user.id) {
            console.warn("Telegram ID", chat_id, "is already associated with another account.");
            sendMessage(chat_id, "This Telegram ID is already associated with another account.");
          } else {
            await user.update({ telegram_user_id: chat_id, telegram_username: username });
            sendWelcomeMessage(chat_id, user.name);
          }
        } else {
          console.warn("User not found with unique identifier:", unique_identifier);
          sendMessage(chat_id, "User not found. Please make sure you entered the correct unique identifier.");
        }
      } else {
        console.warn("Unique identifier not provided in message:", message.text);
        sendMessage(chat_id, "Please provide your unique identifier after the /start command.");
      }
    }
  }

  return successResponse(res, Messages.success);
};

const extractUniqueIdentifier = (text) => {
  return text.split(' ')[1];
};

const sendMessage = (chat_id, text) => {
  bot.sendMessage(chat_id, text).catch((error) => {
    console.error("Failed to send message:", error.message);
  });
};

const sendWelcomeMessage = (chat_id, user_name) => {
  const message = `GM ${user_name}. Welcome! You have just subscribed to receive LocalSolana trade notifications. Your unique chat ID is ${chat_id}. Please make sure I'm not muted!`;
  sendMessage(chat_id, message);
};