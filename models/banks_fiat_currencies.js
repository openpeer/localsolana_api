'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class banks_fiat_currencies extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  banks_fiat_currencies.init({
    bank_id: DataTypes.BIGINT,
    fiat_currency_id: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'banks_fiat_currencies',
  });
  return banks_fiat_currencies;
};