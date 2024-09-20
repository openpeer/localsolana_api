'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Disputes', 'order_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Orders', // Name of the referenced table
        key: 'id'        // Key in the referenced table
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Disputes', 'order_id', {
      type: Sequelize.INTEGER,
      allowNull: false // Adjust allowNull as per your original migration
    });
  }
};
