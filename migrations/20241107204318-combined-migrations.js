'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add accept_only_trusted to lists
    await queryInterface.addColumn('lists', 'accept_only_trusted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    // Create blocked_relationships table
    await queryInterface.createTable('blocked_relationships', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      blocked_user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('blocked_relationships', ['user_id', 'blocked_user_id'], {
      unique: true,
    });

    // Create trusted_relationships table
    await queryInterface.createTable('trusted_relationships', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      trusted_user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('trusted_relationships', ['user_id', 'trusted_user_id'], {
      unique: true,
    });

    // Add unique_identifier to users
    await queryInterface.addColumn('users', 'unique_identifier', {
      type: Sequelize.STRING,
      unique: true,
    });

    // Add telegram and whatsapp columns to users
    await queryInterface.addColumn('users', 'telegram_user_id', {
      type: Sequelize.BIGINT,
      unique: true,
    });
    await queryInterface.addColumn('users', 'telegram_username', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('users', 'whatsapp_country_code', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('users', 'whatsapp_number', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns from users
    await queryInterface.removeColumn('users', 'telegram_user_id');
    await queryInterface.removeColumn('users', 'telegram_username');
    await queryInterface.removeColumn('users', 'whatsapp_country_code');
    await queryInterface.removeColumn('users', 'whatsapp_number');
    await queryInterface.removeColumn('users', 'unique_identifier');

    // Drop trusted_relationships table
    await queryInterface.dropTable('trusted_relationships');

    // Drop blocked_relationships table
    await queryInterface.dropTable('blocked_relationships');

    // Remove accept_only_trusted from lists
    await queryInterface.removeColumn('lists', 'accept_only_trusted');
  },
};