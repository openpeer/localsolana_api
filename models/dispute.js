'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Dispute extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Dispute.belongsTo(models.Orders, {
      //   foreignKey: 'order_id',
      //   onDelete: 'CASCADE', // Optional: cascade delete if Order is deleted
      //   onUpdate: 'CASCADE'  // Optional: cascade update if Order id is updated
      // });
    }
  }
  Dispute.init({
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    order_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    resolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE(6),
        allowNull: false,
        field: 'created_at' // Map to the column name in the database
    },
    updatedAt: {
        type: DataTypes.DATE(6),
        allowNull: false,
        field: 'updated_at' // Map to the column name in the database
    },
    winner_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Dispute',
    tableName: 'disputes',
    timestamps: true, // This will automatically add createdAt and updatedAt fields
    createdAt: 'created_at', // Map to the database column names
    updatedAt: 'updated_at'
  });
  return Dispute;
};