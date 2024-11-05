'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  user.init({
    address: DataTypes.STRING,
    email: DataTypes.STRING,
    name: DataTypes.STRING,
    twitter: DataTypes.STRING,
    image_url: {
      type: DataTypes.STRING,
      field: 'image' 
    },
    verified: DataTypes.BOOLEAN,
    merchant: DataTypes.BOOLEAN,
    timezone: DataTypes.STRING,
    available_from: DataTypes.NUMBER,
    available_to: DataTypes.NUMBER,
    contract_address: DataTypes.STRING,
    weeekend_offline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'weekend_offline' // Maps to the database column 'created_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at' // Maps to the database column 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at' // Maps to the database column 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'user',
  });
  return user;
};