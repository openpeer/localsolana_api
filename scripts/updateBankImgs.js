const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const csv = require('csv-parse');
require('dotenv').config({ path: '../.env' }); // Look for .env in parent directory

// Database configuration from ENV variables
const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false // Set to console.log for debugging
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
  underscored: true,
});

async function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv.parse({ columns: true, delimiter: ',', trim: true }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function updateBankImages(dryRun = false) {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Log database configuration (without password)
    console.log('Database config:', {
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432
    });

    // Read CSV files
    const mappings = await readCSVFile('./data-1731957894463.csv');
    console.log(`Found ${mappings.length} mappings to process`);

    // Process each mapping
    for (const mapping of mappings) {
      const bankId = parseInt(mapping.bank_id);
      const imageKey = mapping.image_key;
      
      if (!imageKey) {
        console.log(`No image key found for bank ${bankId}`);
        continue;
      }

      const imageValue = `${imageKey}.png`;

      if (dryRun) {
        console.log(`Dry run: Would update bank ${bankId} with image: ${imageValue}`);
      } else {
        await Bank.update(
          { image: imageValue },
          { where: { id: bankId } }
        );
        console.log(`Updated bank ${bankId} with image: ${imageValue}`);
      }
    }

    console.log('Bank image update process completed.');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Install required package
console.log('Installing required package...');
const { execSync } = require('child_process');
try {
  execSync('npm install csv-parse', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to install required package. Please run: npm install csv-parse');
  process.exit(1);
}

// Command-line argument parsing
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

updateBankImages(dryRun)
  .then(() => {
    console.log(dryRun ? 'Dry run completed.' : 'Bank images updated successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });