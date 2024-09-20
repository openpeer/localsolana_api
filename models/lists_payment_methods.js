'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class lists_payment_methods extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  lists_payment_methods.init({
    list_id: DataTypes.NUMERIC,
    payment_method_id: DataTypes.NUMERIC
  }, {
    sequelize,
    modelName: 'lists_payment_methods',
  });
  return lists_payment_methods;
};