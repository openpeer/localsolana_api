const TalkjsUserSyncService = require('../services/talkjsUserSyncService');

class TalkjsSyncJob {
  static async perform(models, userId) {
    try {
      const user = await models.user.findByPk(userId);
      if (!user) {
        console.error(`User not found: ${userId}`);
        return;
      }

      const service = new TalkjsUserSyncService();
      await service.syncUser(user);
      console.log(`Successfully synced user with ID: ${userId}`);
    } catch (error) {
      console.error(`Failed to sync user ${userId}: ${error.message}`);
    }
  }
}

module.exports = TalkjsSyncJob;
