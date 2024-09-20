'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class lists_banks extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  lists_banks.init({
    list_id: DataTypes.NUMERIC,
    bank_id: DataTypes.NUMERIC
  }, {
    sequelize,
    modelName: 'lists_banks',
  });
  return lists_banks;
};