'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.renameColumn('fiat_currencies', 'createdAt', 'created_at'),
      queryInterface.renameColumn('fiat_currencies', 'updatedAt', 'updated_at')
    ]);  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
