const { Order } = require('../models'); 
const { authenticateSocket } = require('../middlewares/auth.middleware');

const setupSocketHandlers = (io) => {
    io.use(authenticateSocket); 
    // Handle new socket connections
    io.on('connection', (socket) => {
        socket.on('subscribeToOrder', async (data) => {
            const conditions = {
                id: data.orderId,
                [Op.or]: [
                  { buyer_id: user.id },
                  { seller_id: user.id }
                ]
              };
            try {
                const order = await Order.findOne({
                    where: conditions
                });

                // Check if the order exists
                if (!order) {
                    // Reject the subscription by sending an error message back to the client
                    socket.emit('subscriptionError', { message: 'Order not found or unauthorized' });
                    return;
                }

                // If order is found, subscribe the user to the relevant order room
                socket.join(`OrdersChannel_${order.id}_${data.address}`);
                // Optionally, you can send a confirmation back to the client
                socket.emit('subscriptionSuccess', { message: `Subscribed to order ${order.id}` });
            } catch (error) {
                console.error('Error subscribing to order:', error);
                socket.emit('subscriptionError', { message: 'An error occurred during subscription' });
            }
        });
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};


module.exports = setupSocketHandlers;