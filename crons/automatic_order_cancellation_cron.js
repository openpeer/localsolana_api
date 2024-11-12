const cron = require('node-cron');
const moment = require('moment');
const models = require("../models"); 
const { Op,Sequelize } = require('sequelize');

  const executeAutomaticOrderCancellationTask = async () => {

    const [affectedCount, updatedRecords] = await models.Order.update(
      {
        status: 3,
        cancelled_at: Sequelize.fn('NOW'),
      },
      {
        where: {
          [Op.or]: [
            {
              status: 0,
              deposit_time_limit: { [Op.gt]: 0 },
              created_at: {
                [Op.lte]: Sequelize.literal(`NOW() - (deposit_time_limit * INTERVAL '1 MINUTE')`)
              }
            },
            {
              status: 1,
              payment_time_limit: { [Op.gt]: 0 },
              created_at: {
                [Op.lte]: Sequelize.literal(`NOW() - (payment_time_limit * INTERVAL '1 MINUTE')`)
              }
            }
          ]
        },
        returning: ['id']
        // logging: console.log,
      }
    );
  
    const updatedIds = updatedRecords.map(record => record.id);
    console.log("Total number of row's that has been updated during automatic order cancellation are: ", affectedCount);
    console.log("Order Id's that has been cancelled automatically: ", updatedIds);
  };

  // cron will run after each minute.
  cron.schedule('*/1 * * * *', async () => {
    console.log("Cancelling orders automatically cron job starts at: ", new Date().toLocaleDateString(), new Date().toLocaleTimeString());
    await executeAutomaticOrderCancellationTask();
    console.log("Cancelling orders automatically cron job ends at: ",new Date().toLocaleDateString(),  new Date().toLocaleTimeString());
  });

  // In case cron is hit from the browser
  console.log('Cron job scheduled');