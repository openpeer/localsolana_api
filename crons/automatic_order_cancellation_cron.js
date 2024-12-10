const cron = require('node-cron');
const moment = require('moment');
const models = require("../models"); 
const { Op, Sequelize } = require('sequelize');
const chalk = require('chalk');

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
    }
  );

  const updatedIds = updatedRecords.map(record => record.id);
  if (affectedCount > 0) {
    console.log(
      chalk.bgRed.white.bold('🔄 AUTO-CANCELLED ORDERS:'),
      chalk.yellow(`Count: ${affectedCount}`),
      chalk.cyan(`IDs: [${updatedIds.join(', ')}]`)
    );
  }
};

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log(chalk.bgBlue.white.bold('⏰ ORDER CLEANUP START'));
  await executeAutomaticOrderCancellationTask();
});

console.log(chalk.bgGreen.black.bold('✅ ORDER CLEANUP CRON SCHEDULED (*/5)'));