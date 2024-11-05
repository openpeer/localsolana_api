'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      list_id:{
        type:Sequelize.BIGINT,
        allowNull: false
      },
      buyer_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      fiat_amount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      token_amount: {
        type: Sequelize.INTEGER
      },
      price: {
        type: Sequelize.INTEGER
      },
      uuid: {
        type: Sequelize.STRING
      },
      cancelled_by_id: {
        type: Sequelize.BIGINT
      },
      cancelled_at: {
        type: Sequelize.DATE
      },
      trade_id: {
        type: Sequelize.STRING
      },
      seller_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      payment_method_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      deposit_time_limit: {
        type: Sequelize.INTEGER
      },
      payment_time_limit: {
        type: Sequelize.INTEGER
      },
      chain_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};