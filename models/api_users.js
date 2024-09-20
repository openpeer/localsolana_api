'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class api_users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  api_users.init({
    name: DataTypes.STRING,
    token: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'api_users',
  });
  return api_users;
};