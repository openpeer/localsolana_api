'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      address: {
        type: Sequelize.STRING,
        allowNull:false
      },
      decimals: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      symbol: {
        type: Sequelize.STRING,
        allowNull:false
      },
      name: {
        type: Sequelize.STRING
      },
      chain_id: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      coingecko_id: {
        type: Sequelize.STRING,
        allowNull:false
      },
      coinmarketcap_id: {
        type: Sequelize.STRING,
        allowNull:false
      },
      gasless: {
        type: Sequelize.BOOLEAN,
        defaultValue:false
      },
      position: {
        type: Sequelize.INTEGER
      },
      minimum_amount: {
        type: Sequelize.INTEGER
      },
      allow_binance_rates: {
        type: Sequelize.BOOLEAN,
        defaultValue:false
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
    await queryInterface.dropTable('tokens');
  }
};