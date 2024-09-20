'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lists_banks', {
      list_id: {
        type: Sequelize.NUMERIC
      },
      bank_id: {
        type: Sequelize.NUMERIC
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lists_banks');
  }
};