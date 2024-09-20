'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fiat_currencies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        allowNull:false
      },
      name: {
        type: Sequelize.STRING,
        allowNull:false
      },
      symbol: {
        type: Sequelize.STRING
      },
      country_code: {
        type: Sequelize.STRING
      },
      position: {
        type: Sequelize.INTEGER
      },
      allow_binance_rates: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      default_price_source: {
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
    await queryInterface.dropTable('fiat_currencies');
  }
};