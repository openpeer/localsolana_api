'use strict';
const {
  Model, DataTypes
} = require('sequelize');
const TalkjsSyncJob = require('../jobs/talkjsSyncJob');

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
        if (user.isNewRecord && user.name) {
          user.unique_identifier = user.name.toLowerCase();
        }
      },
      afterSave: async (user, options) => {
        if (user.changed('name') || user.changed('email') || user.changed('image')) {
          TalkjsSyncJob.performLater(user.id);
        }
      },
    },
  });

  user.generateUniqueUsername = async function () {
    let username;
    do {
      username = sanitizeUsername(generateRandomName());
    } while (await user.findOne({ where: { name: username } }));
    return username;
  };

  function generateRandomName() {
    const rng = new RandomNameGenerator(RandomNameGenerator.ROMAN);
    return rng.compose(3);
  }

  function sanitizeUsername(username) {
    let sanitized = username.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 11);
    sanitized += Math.floor(1000 + Math.random() * 9000);
    return sanitized;
  }

  return user;
};