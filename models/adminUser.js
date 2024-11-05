'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class adminUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  adminUser.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    resetpasswordToken: DataTypes.STRING,
    resetPasswordSentAt: DataTypes.STRING,
    role: DataTypes.NUMBER
  }, {
    sequelize,
    modelName: 'adminUser',
  },{
    tableName: "adminUsers"
  });
  return adminUser;
};