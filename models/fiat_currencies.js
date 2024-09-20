'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class fiat_currencies extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  fiat_currencies.init({
    code: DataTypes.STRING,
    name: DataTypes.STRING,
    symbol: DataTypes.STRING,
    country_code: DataTypes.STRING,
    position: DataTypes.INTEGER,
    allow_binance_rates: DataTypes.BOOLEAN,
    default_price_source: DataTypes.INTEGER,
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
    modelName: 'fiat_currencies',
  });
  return fiat_currencies;
};