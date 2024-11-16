'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs'); // Add bcrypt import

module.exports = (sequelize, DataTypes) => {
  class adminUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  adminUser.init(
    {
      email: DataTypes.STRING,
      encrypted_password: DataTypes.STRING,
      reset_password_token: DataTypes.STRING,
      reset_password_sent_at: DataTypes.DATE,
      remember_created_at: DataTypes.DATE,
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at' // Maps to the database column 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at' // Maps to the database column 'updated_at'
      },
      role: DataTypes.NUMBER
    },
    {
      sequelize,
      modelName: 'adminUsers', // Match with class name
      tableName: 'admin_users' // Use the correct table name
    }
  );

  // Hash password before saving if it's provided
  adminUser.beforeCreate(async (user) => {
    if (user.password) {
      user.encrypted_password = await bcrypt.hash(user.password, 10);
      user.password = undefined; // Make sure you don't save the plain password
    }
  });

  return adminUser;
};