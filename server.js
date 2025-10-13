const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const PORT = process.env.PORT || 3000;
const { redisClient } = require('./config/redis');
const { testBucket } = require('./config/s3Config');
const { startBackgroundJobs } = require('./jobs/keepAlive/queue');


const server = http.createServer(app);

// handle redis connection
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// gracefully shut down server
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down server...');

  // Close the server
  await server.close(() => {
    console.log('HTTP server closed.');
  });

  // Close Redis connection
  if (redisClient && redisClient.isReady) {
    console.log('Redis connection closed.');
    await redisClient.disconnect();
  }

  // close mongoDB connection
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }

  process.exit(0);
})

server.listen(PORT, async () => {
  try {
    startBackgroundJobs();
    console.log('Background jobs started successfully.');
  } catch (error) {
    console.error('S3 bucket test failed:', error);
    process.exit(1); // Exit if the S3 bucket test fails
  }
  console.log(`Server is running on port ${PORT}`);
});