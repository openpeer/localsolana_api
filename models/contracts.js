'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class contracts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  contracts.init({
    user_id: DataTypes.BIGINT,
    chain_id: DataTypes.BIGINT,
    address: DataTypes.STRING,
    version: DataTypes.STRING,
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
    modelName: 'contracts',
  });
  return contracts;
};