const { Queue } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');


// Queue for export pitch deck to pptx and pdf formats
const exportQueue = new Queue('exportQueue', {
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

// Function to add a job to the export queue
const addExportJob = async (jobData) => {
    try {
        await exportQueue.add('exportDeck', jobData);
        console.log('Export job added to the queue for deck:', jobData.deckId);
    } catch (error) {
        console.error('Error adding export job to the queue:', error);
        throw new AppError('Failed to add export job to the queue', 500);
    }
};

module.exports = {
    addExportJob
};