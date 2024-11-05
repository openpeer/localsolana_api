'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
       // Association with User model as buyer
       Order.belongsTo(models.user, { as: 'buyer', foreignKey: 'buyer_id' });
      
       // Association with User model as seller
       Order.belongsTo(models.user, { as: 'seller', foreignKey: 'seller_id' });
        // Association with list model as list
       Order.belongsTo(models.lists,{ as: 'list', foreignKey: 'list_id'});
    }
  }
  Order.init({
    list_id:DataTypes.INTEGER,
    buyer_id: DataTypes.INTEGER,
    fiat_amount: DataTypes.INTEGER,
    status: DataTypes.STRING,
    token_amount: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    uuid: DataTypes.STRING,
    cancelled_by_id: DataTypes.INTEGER,
    cancelled_at: DataTypes.DATE,
    trade_id: DataTypes.STRING,
    seller_id: DataTypes.STRING,
    payment_method_id: DataTypes.INTEGER,
    deposit_time_limit: DataTypes.INTEGER,
    payment_time_limit: DataTypes.INTEGER,
    chain_id: DataTypes.INTEGER,
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
    modelName: 'Order',
    tableName: 'orders',
  });
  return Order;
};