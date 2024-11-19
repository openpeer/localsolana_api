// jobs/talkjsSyncJob.js

const TalkjsUserSyncService = require('../services/talkjsUserSyncService');

class TalkjsSyncJob {
  static async perform(models, userId) {
    try {
      const user = await models.user.findByPk(userId);
      if (!user) {
        console.error(`User with ID ${userId} not found.`);
        return;
      }

      const service = new TalkjsUserSyncService();
      await service.syncUser(user);
      console.log(`Successfully synced user ${userId} with TalkJS.`);
    } catch (error) {
      console.error(`Failed to sync user ${userId} with TalkJS: ${error.message}`);
      // Optionally re-throw the error if you want it to be handled upstream
    }
  }
}

module.exports = TalkjsSyncJob;
