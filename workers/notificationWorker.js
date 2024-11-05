//const { Worker } = require('bull');
require("dotenv").config();
const knock = require('../utils/knock');
const models = require("../models/index");
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

    if (
      type === NotificationWorker.NEW_ORDER &&
      (order.dataValues.list.instant || order.dataValues.list.buyList)
    ) {
      return;
    }

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
    };
     console.log('Actor is ',actor);
    let recipients = [actorProfile];

    if (order.dispute || type === NotificationWorker.DISPUTE_RESOLVED) { 
      recipients = [
        { id: seller.address, name: seller.name, email: seller.email },
        { id: buyer.address, name: buyer.name, email: buyer.email },
      ];
    }

    const cancelledBy = order.dataValues.cancelledById === seller.id ? buyer : seller;
    console.log("Triggered workflow", type,recipients);
    await knock.workflows.trigger(type, {
      actor: actorProfile,
      recipients: recipients,
      data: {
        username: actor?.name || this.smallWalletAddress(actor?.address || ""),
        seller: seller.name || this.smallWalletAddress(seller.address),
        buyer: buyer.name || this.smallWalletAddress(buyer.address),
        cancelledBy: cancelledBy
          ? cancelledBy.name || this.smallWalletAddress(cancelledBy.address)
          : null,
        tokenAmount: order.dataValues.tokenAmount?.toString(),
        fiatAmount: order.dataValues.fiatAmount?.toString(),
        token: order.dataValues.list.token.symbol,
        fiat: order.dataValues.list.fiat_currencies.code,
        price: order.dataValues.price.toString(),
        url: `${process.env.FRONTEND_URL}/orders/${order.dataValues.id}`,
        uuid: this.smallWalletAddress(order.dataValues.uuid, 6),
        winner: winner
          ? winner.name || this.smallWalletAddress(winner.address)
          : null,
        paymentMethod: order.dataValues.paymentMethod?.bank.name,
      },
    });
  }

  smallWalletAddress(address, length = 4) {
    return `${address.slice(0, length)}..${address.slice(-length)}`;
  }
}

module.exports = NotificationWorker;
