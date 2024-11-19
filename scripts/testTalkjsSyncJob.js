// testTalkjsSyncJob.js

const models = require('./models'); // Adjust the path to your models directory
const sequelize = models.sequelize;

(async () => {
  try {
    // Ensure the database connection is established
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Create a new user with necessary attributes
    const newUser = await models.user.create({
      email: 'testuser@example.com',
      address: 'TestAddress123',
      // Include any other required fields here
    });

    console.log('User created with ID:', newUser.id);

    // Wait a moment to allow the afterCreate hook to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Test completed. Check the console for TalkjsSyncJob logs.');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
})();
