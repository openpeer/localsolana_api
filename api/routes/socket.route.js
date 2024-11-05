const models = require("../../models/index");
const { authenticateSocket } = require('../../middlewares/auth.middleware');
const { Op } = require('sequelize');

const setupSocketHandlers = (io) => {
    io.use(authenticateSocket); 
    // Handle new socket connections
    io.on('connection', (socket) => {
        console.log("A new socket connection established");
    
        socket.on('subscribeToOrder', async (data) => {
            const userId = socket.user?.dataValues?.id;
            if (!userId) {
                return socket.emit('subscriptionError', { message: 'User not authenticated' });
            }
    
            const conditions = {
                id: data.orderId,
                [Op.or]: [
                    { buyer_id: userId },
                    { seller_id: userId }
                ]
            };
    
            try {
                const order = await models.Order.findOne({ where: conditions });
    
                if (!order) {
                    return socket.emit('subscriptionError', { message: 'Order not found or unauthorized' });
                }
                console.log("order", order);
                const room = `OrdersChannel_${order.dataValues.id}_${userId}`;
                console.log("room ------", room);
                try {
                    await socket.join(room, (err) => {
                        if (err) {
                            console.log('Error joining room:', err);
                        } else {
                            console.log("Socket now in rooms", socket.rooms);
                            socket.emit('subscriptionSuccess', { message: `Subscribed to order ${order.dataValues.id}` });
                        }
                    });
                } catch (error) {
                    console.log("error", error);
                }
               
    
            } catch (error) {
                console.log('Error subscribing to order:', error);
                socket.emit('subscriptionError', { message: 'An error occurred during subscription' });
            }
        });
    
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
    
};


module.exports = setupSocketHandlers;