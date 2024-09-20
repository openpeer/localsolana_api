'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class order_payment_methods extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  order_payment_methods.init({
    payment_method_id: DataTypes.NUMERIC,
    order_id: DataTypes.NUMERIC
  }, {
    sequelize,
    modelName: 'order_payment_methods',
  });
  return order_payment_methods;
};