// config/database.js

require('dotenv').config();

const Promise = require('promise');
const { Client } = require('pg');
const { Sequelize } = require("sequelize");


// const connectionString = process.env.DATABASE_URL;

// const dbConfig = {
//     user:  "postgres",
//     host: "localhost",
//     database: "postgres",
//     password: "admin",
//     port:5432,
//   };
//   const client = new Client(dbConfig);

console.log('Database Config:', {
  name: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  nodeEnv: process.env.NODE_ENV
});

// Use environment variables for database configuration
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: 5432,
  logging: console.log, // enable logging to see SQL queries
});


const testDbConnection = async () => {
    try {
      await sequelize.authenticate();
      console.log("Connection has been established successfully.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  };

module.exports = { sq: sequelize, testDbConnection };
