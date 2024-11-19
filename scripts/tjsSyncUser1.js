const TalkjsSyncJob = require('./jobs/talkjsSyncJob');
const models = require('./models');

(async () => {
  await TalkjsSyncJob.perform(models, 1); // Replace `1` with your user ID
})();
