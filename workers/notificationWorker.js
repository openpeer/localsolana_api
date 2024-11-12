//const { Worker } = require('bull');
require("dotenv").config();
const knock = require('../utils/knock');
const models = require("../models/index");
const TelegramBot = require('node-telegram-bot-api');

class NotificationWorker {
  static NEW_ORDER = "new-order";
  static SELLER_ESCROWED = "seller-escrowed";
  static BUYER_PAID = "buyer-paid";
  static SELLER_RELEASED = "seller-released";
  static ORDER_CANCELLED = "order-cancelled";
  static DISPUTE_OPENED = "dispute-opened";
  static DISPUTE_RESOLVED = "dispute-resolved";

  async perform(type, orderId) {
    const order = await models.Order.findOne({
      where: {
        id: orderId,
      },
      include: [
        { model: models.user, as: "buyer" }, // Fetches the associated buyer
        { model: models.user, as: "seller" }, // Fetches the associated seller
        { model: models.user, as: "cancelledBy" },
        {
          model: models.lists,
          as: "list",
          include: [
            { model: models.tokens, as: "token" },
            { model: models.fiat_currencies, as: "fiat_currencies" },
          ],
        },
      ],
    });

    const seller = order.dataValues.seller;
    const buyer = order.dataValues.buyer;
    const winner = order.dataValues.dispute?.winner;

    // if (
    //   type === NotificationWorker.NEW_ORDER &&
    //   (order.dataValues.list.instant || order.dataValues.list.buyList)
    // ) {
    //   return;
    // }

    let actor;
    switch (type) {
      case NotificationWorker.NEW_ORDER:
      case NotificationWorker.BUYER_PAID:
        actor = seller;
        break;
      case NotificationWorker.SELLER_ESCROWED:
      case NotificationWorker.SELLER_RELEASED:
      case NotificationWorker.DISPUTE_OPENED:
        actor = buyer;
        break;
      case NotificationWorker.ORDER_CANCELLED:
        actor = order.dataValues.cancelledById === seller.id ? buyer : seller;
        break;
      case NotificationWorker.DISPUTE_RESOLVED:
        actor = winner;
        break;
    }
   
    const actorProfile = {
      id: actor?.address,
      name: actor?.name,
      email: actor?.email,
      telegram_user_id: actor?.telegram_user_id,
    };

    console.log('Actor is ',actor);

    let recipients = [actorProfile];
    if (order.dispute || type === NotificationWorker.DISPUTE_RESOLVED) { 
      recipients = [
        { id: seller.address, name: seller.name, email: seller.email, telegram_user_id: seller.telegram_user_id },
        { id: buyer.address, name: buyer.name, email: buyer.email, telegram_user_id: buyer.telegram_user_id },
      ];
    }

    const cancelledBy = order.dataValues.cancelledBy;

    console.log("Triggered workflow", type,recipients);

    const data = {
      username: actor?.name || this.smallWalletAddress(actor?.address || ""),
      seller: seller.name || this.smallWalletAddress(seller.address),
      buyer: buyer.name || this.smallWalletAddress(buyer.address),
      cancelled_by: cancelledBy ? cancelledBy.name || this.smallWalletAddress(cancelledBy.address) : null,
      token_amount: order.dataValues.tokenAmount?.toString() || "0",
      fiat_amount: order.dataValues.fiatAmount?.toString() || "0",
      token: order.dataValues.list.token.symbol || "N/A",
      fiat: order.dataValues.list.fiat_currencies.code || "N/A",
      price: order.dataValues.price?.toString() || "0",
      url: `${process.env.FRONTEND_URL}/orders/${order.dataValues.id}`,
      uuid: this.smallWalletAddress(order.dataValues.trade_id, 6),
      winner: winner ? winner.name || this.smallWalletAddress(winner.address) : null,
      payment_method: order.dataValues.paymentMethod?.bank.name || "N/A",
      order_number: order.dataValues.id,
    };
    await knock.workflows.trigger(type, {
      actor: actorProfile,
      recipients: recipients,
      data: data,
    });

    this.sendTelegramNotification(type, actor, recipients, data);
  }

  sendTelegramNotification(type, actor, recipients, data) {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

    recipients.forEach(recipient => {
      if (!recipient.telegram_user_id) return;

      const message = this.formatTelegramMessage(type, actor, data);
      bot.sendMessage(recipient.telegram_user_id, message, { parse_mode: 'Markdown' })
        .then(response => {
          console.log(`Telegram notification sent successfully to user ${recipient.telegram_user_id} for order ${data.uuid}`);
        })
        .catch(error => {
          console.error(`Error sending Telegram notification to user ${recipient.telegram_user_id} for order ${data.uuid}: ${error.message}`);
        });
    });
  }

  formatTelegramMessage(type, actor, data) {
    let baseMessage;
    switch (type) {
      case NotificationWorker.NEW_ORDER:
        baseMessage = `New order #${data.order_number} received from ${data.buyer} for ${data.token_amount} ${data.token} (${data.fiat_amount} ${data.fiat})`;
        break;
      case NotificationWorker.SELLER_ESCROWED:
        baseMessage = `Seller ${data.seller} has escrowed ${data.token_amount} ${data.token} for your order #${data.order_number}`;
        break;
      case NotificationWorker.BUYER_PAID:
        baseMessage = `Buyer ${data.buyer} has marked the payment as sent for ${data.fiat_amount} ${data.fiat} for order #${data.order_number}`;
        break;
      case NotificationWorker.SELLER_RELEASED:
        baseMessage = `Seller ${data.seller} has released ${data.token_amount} ${data.token} for your order #${data.order_number}`;
        break;
      case NotificationWorker.ORDER_CANCELLED:
        baseMessage = `Order ${data.uuid} #${data.order_number} has been cancelled by ${data.cancelled_by}`;
        break;
      case NotificationWorker.DISPUTE_OPENED:
        baseMessage = `A dispute has been opened for order ${data.uuid} #${data.order_number}`;
        break;
      case NotificationWorker.DISPUTE_RESOLVED:
        baseMessage = `The dispute for order ${data.uuid} #${data.order_number} has been resolved. Winner: ${data.winner}`;
        break;
      default:
        baseMessage = `Order ${data.uuid} #${data.order_number} status update: ${type}`;
    }

    return `${baseMessage}\n\n[View Order](${data.url}) | Copy link: \`${data.url}\``;
  }

  smallWalletAddress(address, length = 4) {
    if (!address) return "N/A";
    return `${address.slice(0, length)}..${address.slice(-length)}`;
  }
}

module.exports = NotificationWorker;
