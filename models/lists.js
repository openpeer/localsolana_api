'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class lists extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Association with User model as buyer
      lists.belongsTo(models.tokens, { as: 'token', foreignKey: 'token_id' });
      lists.belongsTo(models.fiat_currencies, { as: 'fiat_currencies', foreignKey: 'fiat_currency_id' });
    }
  }
  lists.init({
    chain_id: DataTypes.INTEGER,
    seller_id: DataTypes.BIGINT,
    token_id: DataTypes.BIGINT,
    fiat_currency_id: DataTypes.BIGINT,
    total_available_amount: DataTypes.INTEGER,
    limit_min: DataTypes.INTEGER,
    limit_max: DataTypes.INTEGER,
    margin_type: DataTypes.INTEGER,
    margin: DataTypes.INTEGER,
    terms: DataTypes.STRING,
    automatic_approval: DataTypes.BOOLEAN,
    status: DataTypes.INTEGER,
    payment_method_id: DataTypes.INTEGER,
    type: DataTypes.STRING,
    bank_id: DataTypes.BIGINT,
    deposit_time_limit: DataTypes.INTEGER,
    payment_time_limit: DataTypes.INTEGER,
    accept_only_verified: DataTypes.BOOLEAN,
    escrow_type: DataTypes.INTEGER, //  [:manual, :instant], 0 means manual and 1 means instant
    price_source: DataTypes.INTEGER, // [:coingecko, :binance_median, :binance_min, :binance_max], default: 0
    price: DataTypes.INTEGER,
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
    modelName: 'lists',
  });
  return lists;
};