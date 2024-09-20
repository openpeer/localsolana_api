'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class setting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  setting.init({
    name: DataTypes.STRING,
    value: DataTypes.STRING,
    description: DataTypes.STRING,
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
    modelName: 'setting',
  });
  return setting;
};