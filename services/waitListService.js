const WaitList = require('../models/waitList');
const { AppError } = require('../utils/error');


const addToWaitListService = async (email) => {
    try {
        if (!email) {
            throw new AppError('Email is required to join the waitlist', 400);
        }

        // Check if the email already exists in the waitlist
        const existingEntry = await WaitList.findOne({ email });
        if (existingEntry) {
            throw new AppError('This email is already on the waitlist', 400);
        }

        // Create a new entry in the waitlist
        const newEntry = await WaitList.create({ email });
        return newEntry;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error adding to waitlist:', error);
        throw new AppError('Failed to add to waitlist', 500);
    }
};


// Get total number of users on the waitlist
const getWaitListCountService = async () => {
    try {
        const count = await WaitList.countDocuments();
        return count;
    } catch (error) {
        console.error('Error fetching waitlist count:', error);
        throw new AppError('Failed to fetch waitlist count', 500);
    }
};

// export services
module.exports = {
    addToWaitListService, getWaitListCountService,
}