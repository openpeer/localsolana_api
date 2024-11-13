const models = require('../models');
const TalkjsUserSyncService = require('../services/talkjsUserSyncService');

class TalkjsSyncJob {
  static async performLater(userId) {
    setTimeout(() => this.perform(userId), 0);
  }

  static async perform(userId) {
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