const TalkjsUserSyncService = require('../services/talkjsUserSyncService');

class TalkjsSyncJob {
  static async performLater(models, userId) {
    setTimeout(() => this.perform(models, userId), 0);
  }

  static async perform(models, userId) {
    try {
      const user = await models.user.findByPk(userId);
      if (!user) return;

      const service = new TalkjsUserSyncService();
      await service.syncUser(user);
    } catch (error) {
      console.error(`Failed to sync user ${userId} with TalkJS: ${error.message}`);
      throw error;
    }
  }
}

module.exports = TalkjsSyncJob;