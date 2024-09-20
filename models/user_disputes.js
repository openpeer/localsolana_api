'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user_disputes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  user_disputes.init({
    dispute_id: DataTypes.BIGINT,
    user_id: DataTypes.BIGINT,
    comments: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'user_disputes',
  });
  return user_disputes;
};