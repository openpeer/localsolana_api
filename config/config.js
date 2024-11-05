// config/config.js
require('dotenv').config();
module.exports = {
    development: {
      username: "postgres",
      password: "IpEQ5lEF5EQiWo",
      database: "solana_db",
      host: "64.227.143.219",
      dialect: "postgres"
    },
    test: {
      username: "root",
      password: null,
      database: "database_test",
      host: "127.0.0.1",
      dialect: "mysql"
    },
    production: {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT
    }
  };