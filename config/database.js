const Promise = require('promise');
const { Client } = require('pg');
const { Sequelize } = require("sequelize");
require('dotenv').config();



// const connectionString = process.env.DATABASE_URL;

// const dbConfig = {
//     user:  "postgres",
//     host: "localhost",
//     database: "postgres",
//     password: "admin",
//     port:5432,
//   };
//   const client = new Client(dbConfig);

const sequelize = new Sequelize(process.env.database, process.env.username, process.env.password, {
    host: process.env.host,
    dialect: process.env.dialect,
})


const testDbConnection = async () => {
    try {
      await sequelize.authenticate();
      console.log("Connection has been established successfully.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  };

module.exports = { sq: sequelize, testDbConnection };
