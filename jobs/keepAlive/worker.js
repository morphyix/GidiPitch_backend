// jobs/scheduledWorker.js
const { Worker } = require('bullmq');
const { redisClient } = require('../../config/redis');
const axios = require('axios');

const scheduledWorker = new Worker(
  'scheduledQueue',
  async (job) => {
    console.log('Processing scheduled job:', job.id);

    // send a request to your own server to keep it alive


    // E.g., check pending tasks, clean expired data, send queued emails, etc.
    console.log('✅ Background job logic executed.');
  },
  { connection: redisClient }
);

scheduledWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});
