'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      address: {
        type: Sequelize.STRING,
        allowNull:false
      },
      email: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      twitter: {
        type: Sequelize.STRING
      },
      image: {
        type: Sequelize.STRING
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      merchant: {
        type: Sequelize.BOOLEAN,
        defaultValue:false
      },
      timezone: {
        type: Sequelize.STRING
      },
      available_from: {
        type: Sequelize.INTEGER
      },
      available_to: {
        type: Sequelize.INTEGER
      },
      weeekend_offline: {
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
    await queryInterface.dropTable('users');
  }
};