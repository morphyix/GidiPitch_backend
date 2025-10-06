const { Queue } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');


// Queue for pitch deck generation jobs
const pitchDeckQueue = new Queue('pitchDeckQueue', {
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


// Function to add a job to the pitch deck generation queue
const addPitchDeckJob = async (jobData) => {
    try {
        await pitchDeckQueue.add('generatePitchDeck', jobData);
        console.log('Pitch deck generation job added to the queue for user:', jobData.userId);
    } catch (error) {
        console.error('Error adding pitch deck job to the queue:', error);
        throw new AppError('Failed to add pitch deck job to the queue', 500);
    }
};

module.exports = {
    addPitchDeckJob
};