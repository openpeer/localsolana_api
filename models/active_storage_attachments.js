'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class active_storage_attachments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  active_storage_attachments.init({
    name: DataTypes.STRING,
    record_type: DataTypes.STRING,
    record_id: DataTypes.BIGINT,
    blob_id: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'active_storage_attachments',
  });
  return active_storage_attachments;
};