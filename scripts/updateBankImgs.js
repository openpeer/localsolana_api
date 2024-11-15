const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize connection
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Define the models for active_storage_blobs and banks
const ActiveStorageBlob = sequelize.define('ActiveStorageBlob', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'active_storage_blobs',
  timestamps: false,
});

const Bank = sequelize.define('Bank', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'banks',
  timestamps: true,
  underscored: true, // Correct mapping for snake_case columns
});

// Function to update image field in banks table with a dry run option
async function updateBankImages(dryRun = false) {
  try {
    // Fetch all records from active_storage_blobs
    const blobs = await ActiveStorageBlob.findAll({
      attributes: ['id', 'key'],
    });

    // Loop through the blobs and simulate or perform the update
    for (const blob of blobs) {
      // Find the corresponding bank by matching IDs
      const bank = await Bank.findOne({ where: { id: blob.id } });

      if (bank) {
        // Append ".png" to the key value before updating the image field
        const imageKey = `${blob.key}.png`;

        if (dryRun) {
          // Log what would happen without updating the database
          console.log(`Dry run: Bank ID ${bank.id} would be updated with image key: ${imageKey}`);
        } else {
          // Update the bank's image column with the modified key value
          await bank.update({ image: imageKey });
          console.log(`Updated bank ID ${bank.id} with image key: ${imageKey}`);
        }
      } else {
        console.log(`No bank found for active_storage_blob ID ${blob.id}`);
      }
    }

    console.log('Bank image update process completed.');
  } catch (error) {
    console.error('Error updating bank images:', error);
  }
}

// Command-line argument parsing
const args = process.argv.slice(2);  // Get the command-line arguments
const dryRun = args.includes('--dry-run');  // Check if the dry-run flag is provided

// Run the updateBankImages function with the dryRun flag
updateBankImages(dryRun)
  .then(() => {
    console.log(dryRun ? 'Dry run completed, check the console for actions.' : 'Bank images updated successfully!');
    process.exit(0);  // Exit after completing the process
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);  // Exit with error code if something goes wrong
  });
