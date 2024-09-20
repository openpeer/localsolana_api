'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class cancellation_reasons extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  cancellation_reasons.init({
    order_id: DataTypes.BIGINT,
    reason: DataTypes.STRING,
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
    modelName: 'cancellation_reasons',
  });
  return cancellation_reasons;
};