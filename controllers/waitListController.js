const { addToWaitListService, getWaitListCountService } = require('../services/waitListService');
const { AppError } = require('../utils/error');
const { validateEmail } = require('../utils/validators');


// Controller to handle adding an email to the waitlist
const addToWaitListController = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email || !validateEmail(email)) {
            throw new AppError('Invalid email format', 400);
        }

        const newEntry = await addToWaitListService(email);
        
        const waitListCount = await getWaitListCountService();

        return res.status(201).json({
            status: 'success',
            message: 'Email added to waitlist successfully',
            data: {
                entry: newEntry.toObject(),
                waitListCount: waitListCount
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error); // Pass AppError to
        }

        return next(new AppError('An error occurred while adding to the waitlist', 500));
    }
};


// Get waitlist count
const getWaitListCountController = async (req, res, next) => {
    try {
        const count = await getWaitListCountService();
        return res.status(200).json({
            status: 'success',
            message: 'Waitlist count fetched successfully',
            data: { count }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error); // Pass AppError to the error handler
        }
        return next(new AppError('An error occurred while fetching the waitlist count', 500));
    }
}


// Export Controllers
module.exports = {
    addToWaitListController, getWaitListCountController,
}