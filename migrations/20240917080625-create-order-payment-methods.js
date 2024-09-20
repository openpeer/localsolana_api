'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_payment_methods', {
      payment_method_id: {
        type: Sequelize.NUMERIC
      },
      order_id: {
        type: Sequelize.NUMERIC
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_payment_methods');
  }
};