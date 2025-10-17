const { Queue } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');


// Queue for slide correction jobs
const slideCorrectionQueue = new Queue('slideCorrectionQueue', {
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

// Function to add a job to the slide correction queue
const addSlideCorrectionJob = async (jobData) => {
    try {
        await slideCorrectionQueue.add('correctSlide', jobData);
        console.log('Slide correction job added to the queue for slide:', jobData.slideId);
    } catch (error) {
        console.error('Error adding slide correction job to the queue:', error);
        throw new AppError('Failed to add slide correction job to the queue', 500);
    }
};

module.exports = {
    addSlideCorrectionJob
};