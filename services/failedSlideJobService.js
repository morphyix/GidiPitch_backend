// Failed Slide Job service module
const mongoose = require('mongoose');
const { AppError } = require('../utils/error');
const FailedSlideJob = require('../models/failedSlideJob');


// Create a failed slide job entry
const logFailedSlideJobService = async (userId, slideId, prompt, errorMsg, jobId = null) => {
    try {
        if (!userId || !slideId || !correction) {
            throw new AppError('Invalid data provided for logging failed slide job', 400);
        }

        const slideJob = {
            userId,
            slideId,
            prompt,
        };

        if (errorMsg) {
            slideJob.error = errorMsg;
        }

        if (jobId) {
            slideJob.jobId = jobId;
        }

        const failedJob = await FailedSlideJob.create(slideJob);
        return failedJob;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error logging failed slide job:', error);
        throw new AppError('Failed to log slide job', 500);
    }
};


// Get failed slide job by slideId
const getFailedSlideJobBySlideIdService = async (slideId) => {
    try {
        if (!slideId) {
            throw new AppError('Slide ID is required', 400);
        }

        if (mongoose.Types.ObjectId.isValid(slideId) === false) {
            throw new AppError('Invalid Slide ID format', 400);
        }

        // Get failed job by slideId
        const failedJob = await FailedSlideJob.findOne({ slideId }).sort({ createdAt: -1 });
        if (!failedJob) {
            throw new AppError('Failed slide job not found', 404);
        }
        return failedJob;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error fetching failed slide job:', error);
        throw new AppError('Failed to fetch slide job', 500);
    }
};


// Delete failed slide job by slideId
const deleteFailedSlideJobBySlideIdService = async (slideId) => {
    try {
        if (!slideId) {
            throw new AppError('Slide ID is required', 400);
        }

        if (mongoose.Types.ObjectId.isValid(slideId) === false) {
            throw new AppError('Invalid Slide ID format', 400);
        }

        const deletionResult = await FailedSlideJob.deleteMany({ slideId });
        if (deletionResult.deletedCount === 0) {
            throw new AppError('No failed slide jobs found to delete', 404);
        }
        return true;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error deleting failed slide job:', error);
        throw new AppError('Failed to delete slide job', 500);
    }
};


module.exports = {
    logFailedSlideJobService,
    getFailedSlideJobBySlideIdService,
    deleteFailedSlideJobBySlideIdService,
};