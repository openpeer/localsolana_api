'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('lists', 'price', {
      type: Sequelize.FLOAT,
      allowNull: true, 
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('lists', 'price');
  }
};