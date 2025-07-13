const { Queue } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');


// create a queue for email jobs
const emailQueue = new Queue('emailQueue', {
    connection: redisClient,
    defaultJobOptions: {
        attempts: 3, // Number of retry attempts
        backoff: {
            type: 'exponential', // Exponential backoff
            delay: 5000 // Initial delay of 5 seconds
        },
        removeOnComplete: true, // Remove job from queue when completed
    }
});


// function to add email job to the queue
const addEmailJob = async (jobData) => {
    try {
        await emailQueue.add('sendEmail', jobData);
        console.log('Email job added to the queue:', jobData.to);
    } catch (error) {
        console.error('Error adding email job to the queue:', error);
        throw new AppError('Failed to add email job to the queue', 500);
    }
};


module.exports = {
    addEmailJob
};