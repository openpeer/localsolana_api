'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tokens extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  tokens.init({
    address: DataTypes.STRING,
    decimals: DataTypes.INTEGER,
    symbol: DataTypes.STRING,
    name: DataTypes.STRING,
    chain_id: DataTypes.INTEGER,
    coingecko_id: DataTypes.STRING,
    coinmarketcap_id: DataTypes.STRING,
    gasless: DataTypes.BOOLEAN,
    position: DataTypes.INTEGER,
    minimum_amount: DataTypes.INTEGER,
    allow_binance_rates: DataTypes.BOOLEAN,
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
    modelName: 'tokens',
  });
  return tokens;
};