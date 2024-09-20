// run-migration.js

const { sequelize } = require('./models'); // Adjust the path to your models
const fs = require('fs');
const path = require('path');

// Path to your migration file
const migrationFilePath = path.join(__dirname, 'migrations', '20240618204451-create-lists-payment_methods.js');

// Import the migration file
const migration = require(migrationFilePath);

(async () => {
  try {
    // Initialize the query interface
    const queryInterface = sequelize.getQueryInterface();
    
    // Run the migration up method
    await migration.up(queryInterface, sequelize.Sequelize);

    console.log('Migration executed successfully');
  } catch (error) {
    console.error('Error executing migration:', error);
  } finally {
    // Close the connection
    await sequelize.close();
  }
})();
