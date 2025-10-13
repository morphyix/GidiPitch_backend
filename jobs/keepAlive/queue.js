// jobs/scheduler.js
require('dotenv').config();
const { Queue } = require('bullmq');
const { redisClient } = require('../../config/redis');

const FIVE_MINUTES = 5 * 60 * 1000;

const startBackgroundJobs = () => {
  console.log('🕒 Background scheduler started.');

  setInterval(async () => {
    try {
      console.log(`[${new Date().toISOString()}] Triggering scheduled job...`);

      // Example: enqueue a BullMQ job
      const queue = new Queue('scheduledQueue', { connection: redisClient });
      await queue.add('runScheduledTask', {}, { removeOnComplete: true });

      console.log('✅ Job enqueued successfully.');
    } catch (error) {
      console.error('❌ Error scheduling job:', error);
    }
  }, FIVE_MINUTES);
};

module.exports = { startBackgroundJobs };
