const { Worker } = require('some-queue-library'); // Replace with actual queue library
const Knock = require('knock');

class NotificationWorker extends Worker {
  static NEW_ORDER = 'new-order';
  static SELLER_ESCROWED = 'seller-escrowed';
  static BUYER_PAID = 'buyer-paid';
  static SELLER_RELEASED = 'seller-released';
  static ORDER_CANCELLED = 'order-cancelled';
  static DISPUTE_OPENED = 'dispute-opened';
  static DISPUTE_RESOLVED = 'dispute-resolved';

  async perform(type, orderId) {
    const order = await models.order.findById(orderId).populate('list buyer cancelledBy');
    const seller = order.seller;
    const buyer = order.buyer;
    const winner = order.dispute?.winner;

    if (type === NotificationWorker.NEW_ORDER && (order.list.instant || order.list.buyList)) {
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
        actor = order.cancelledBy.id === seller.id ? buyer : seller;
        break;
      case NotificationWorker.DISPUTE_RESOLVED:
        actor = winner;
        break;
    }

    const actorProfile = { id: actor?.address, name: actor?.name, email: actor?.email };
    let recipients = [actorProfile];

    if (order.dispute || type === NotificationWorker.DISPUTE_RESOLVED) {
      recipients = [
        { id: seller.address, name: seller.name, email: seller.email },
        { id: buyer.address, name: buyer.name, email: buyer.email }
      ];
    }

    const cancelledBy = order.cancelledBy;
    await Knock.Workflows.trigger({
      key: type,
      actor: actorProfile,
      recipients: recipients,
      data: {
        username: actor?.name || this.smallWalletAddress(actor?.address || ''),
        seller: seller.name || this.smallWalletAddress(seller.address),
        buyer: buyer.name || this.smallWalletAddress(buyer.address),
        cancelledBy: cancelledBy ? (cancelledBy.name || this.smallWalletAddress(cancelledBy.address)) : null,
        tokenAmount: order.tokenAmount.toString(),
        fiatAmount: order.fiatAmount.toString(),
        token: order.list.token.symbol,
        fiat: order.list.fiatCurrency.code,
        price: order.price.toString(),
        url: `${process.env.FRONTEND_URL}/orders/${order.uuid}`,
        uuid: this.smallWalletAddress(order.uuid, 6),
        winner: winner ? (winner.name || this.smallWalletAddress(winner.address)) : null,
        paymentMethod: order.paymentMethod?.bank.name
      }
    });
  }

  smallWalletAddress(address, length = 4) {
    return `${address.slice(0, length)}..${address.slice(-length)}`;
  }
}

module.exports = NotificationWorker;
