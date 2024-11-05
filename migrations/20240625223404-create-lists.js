'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lists', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      chain_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      seller_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      token_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      fiat_currency_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      total_available_amount: {
        type: Sequelize.INTEGER
      },
      limit_min: {
        type: Sequelize.INTEGER
      },
      limit_max: {
        type: Sequelize.INTEGER
      },
      margin_type: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      margin: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      terms: {
        type: Sequelize.STRING
      },
      automatic_approval: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      payment_method_id: {
        type: Sequelize.BIGINT
      },
      type: {
        type: Sequelize.STRING
      },
      bank_id: {
        type: Sequelize.BIGINT
      },
      deposit_time_limit: {
        type: Sequelize.INTEGER
      },
      payment_time_limit: {
        type: Sequelize.INTEGER
      },
      accept_only_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      escrow_type: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      price_source: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lists');
  }
};