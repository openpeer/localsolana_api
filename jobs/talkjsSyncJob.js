const TalkjsUserSyncService = require('../services/talkjsUserSyncService');

class TalkjsSyncJob {
  static async perform(models, userId) {
    const service = new TalkjsUserSyncService();
    
    try {
      const user = await models.user.findByPk(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      await service.syncUser(user);
      console.log(`Successfully synced user with ID: ${userId}`);
    } catch (error) {
      console.error(`Failed to sync user ${userId}: ${error.message}`);
      throw error; // Re-throw to allow proper error handling upstream
    }
  }
}

module.exports = TalkjsSyncJob;