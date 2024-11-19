'use strict';
const {
  Model, DataTypes
} = require('sequelize');
const TalkjsSyncJob = require('../jobs/talkjsSyncJob');
const { uniqueNamesGenerator, colors, animals } = require('unique-names-generator');
const { v4: uuidv4 } = require("uuid");


module.exports = (sequelize) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async generateUniqueUsername() {
      let username;
      let isUnique = false;
      while (!isUnique) {
        username = uniqueNamesGenerator({ dictionaries: [colors, animals] });
        const existingUser = await this.findOne({ where: { name: username } });
        if (!existingUser) {
          isUnique = true;
        }
      }
      return username;
    }
  }
  
  user.init({
    address: DataTypes.STRING,
    email: DataTypes.STRING,
    name: DataTypes.STRING,
    twitter: DataTypes.STRING,
    image_url: {
      type: DataTypes.STRING,
      field: 'image' 
    },
    verified: DataTypes.BOOLEAN,
    merchant: DataTypes.BOOLEAN,
    timezone: DataTypes.STRING,
    available_from: DataTypes.NUMBER,
    available_to: DataTypes.NUMBER,
    contract_address: DataTypes.STRING,
    weeekend_offline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'weekend_offline' // Maps to the database column 'created_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at' // Maps to the database column 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at' // Maps to the database column 'updated_at'
    },
    telegram_user_id: {
      type: DataTypes.BIGINT,
      unique: true,
    },
    telegram_username: {
      type: DataTypes.STRING,
    },
    whatsapp_country_code: {
      type: DataTypes.STRING,
    },
    whatsapp_number: {
      type: DataTypes.STRING,
    },
    unique_identifier: {
      type: DataTypes.STRING,
      unique: true,
    },
  }, {
    sequelize,
    modelName: 'user',
    hooks: {
      beforeValidate: async (user, options) => {
        if (user.isNewRecord) {
          if (!user.unique_identifier) {
            user.unique_identifier = uuidv4();
          }
          if (!user.name) {
            user.name = await user.constructor.generateUniqueUsername();
          }
          TalkjsSyncJob.perform(sequelize.models, user.id);
        }
      },
    }
  });

  return user;
};