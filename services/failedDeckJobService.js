const mongoose = require('mongoose');
const FailedDeckJob = require('../models/failedDeckJobs');
const { AppError } = require('../utils/error');


// Service to log a failed deck generation job
const logFailedDeckJobService = async (userId, deckId, slides, errorMsg, jobId = null) => {
    try {
        if (!userId || !deckId || !slides || !errorMsg) {
            throw new AppError('Invalid data provided for logging failed deck job', 400);
        }

        if (!Array.isArray(slides)) {
            throw new AppError('Slides must be an array', 400);
        }

        DeckJob = {
            userId,
            deckId,
            slides,
            error: errorMsg,
        }
        if (jobId) {
            DeckJob.jobId = jobId;
        }

        const failedJob = await FailedDeckJob.create(DeckJob);
        return failedJob;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error logging failed deck job:', error);
        throw new AppError('Failed to log deck job', 500);
    }
};


// Get failedJob by deckId
const getFailedDeckJobByIdService = async (deckId) => {
    try {
        if (!deckId) {
            throw new AppError('Deck ID is required', 400);
        }

        if (mongoose.Types.ObjectId.isValid(deckId) === false) {
            throw new AppError('Invalid Deck ID format', 400);
        }

        // Get failed job by deckId
        const failedJob = await FailedDeckJob.findOne({ deckId }).sort({ createdAt: -1 });
        if (!failedJob) {
            throw new AppError('Failed deck job not found', 404);
        }
        return failedJob;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error fetching failed deck job:', error);
        throw new AppError('Failed to fetch deck job', 500);
    }
};


// Delete failed jobs
const deleteFailedDeckJobService = async (deckId) => {
    try {
        if (!deckId) {
            throw new AppError('Deck ID is required', 400);
        }

        if (mongoose.Types.ObjectId.isValid(deckId) === false) {
            throw new AppError('Invalid Deck ID format', 400);
        }

        // Delete failed deck job
        const deletedJob = await FailedDeckJob.findOneAndDelete({ deckId });
        if (!deletedJob) {
            throw new AppError('Failed deck job not found or already deleted', 404);
        }
        return true;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error deleting failed deck job:', error);
        throw new AppError('Failed to delete deck job', 500);
    }
};


// Export functions
module.exports = {
    logFailedDeckJobService,
    getFailedDeckJobByIdService,
    deleteFailedDeckJobService,
};