'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lists_payment_methods', {
      list_id: {
        type: Sequelize.NUMERIC
      },
      payment_method_id: {
        type: Sequelize.NUMERIC
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lists_payment_methods');
  }
};