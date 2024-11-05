'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class dispute_files extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      dispute_files.belongsTo(models.user_disputes, {
        foreignKey: 'user_dispute_id',
        as: 'user_dispute',
      });
    }
  }
  dispute_files.init({
    user_dispute_id: DataTypes.BIGINT,
    filename: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'dispute_files',
    createdAt: 'created_at', // Map to the database column names
    updatedAt: 'updated_at'
  });
  return dispute_files;
};