'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class banks extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      banks.belongsToMany(models.fiat_currencies, {
        through: models.banks_fiat_currencies,
        foreignKey: 'bank_id',
        otherKey: 'fiat_currency_id',
        as: 'fiatCurrencies'
      });
    }
  }
  banks.init({
    name: DataTypes.STRING,
    account_info_schema: DataTypes.JSON,
    color: DataTypes.STRING,
    image: DataTypes.STRING,
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at' // Maps to the database column 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at' // Maps to the database column 'updated_at'
    }
    // fiatCurrencies: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'banks',
  });
  return banks;
};