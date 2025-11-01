const { modifyUserTokensService } = require('../services/authService');
const { createTokenTransactionService, getTokenTransactionsByUserService } = require('../services/tokenTransactionService');
const { AppError } = require('../utils/error');


// Add tokens to user account controller
const addPurchaseTokensController = async (req, res, next) => {
    try {
        const user = req.user; // Assuming user is attached to req by auth middleware
        const { amount } = req.body;
        const paymentMethod = req.paymentMethod || 'paystack';

        if (!amount || amount <= 0) {
            throw new AppError('Amount must be greater than zero', 400);
        }

        // Convert amount to tokens (0.15 USD = 10 tokens)
        const tokensToAdd = Math.floor((amount / 0.15) * 10);

        const updatedUser = await modifyUserTokensService(user._id, 'add', tokensToAdd);

        // Record the token transaction
        await createTokenTransactionService(user._id, 'add', amount, tokensToAdd, updatedUser.tokens, paymentMethod);

        updatedUser.password = undefined; // Remove password from response

        res.status(200).json({
            status: 'success',
            message: `${tokensToAdd} tokens added successfully`,
            data: { user: updatedUser }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error); // Pass custom AppError to error handling middleware
        }
        console.error('Error adding tokens:', error);
        return next(new AppError('An error occurred while adding tokens', 500));
    }
};


// Get token transactions for a user controller
const getTokenTransactionsController = async (req, res, next) => {
    try {
        const user = req.user; // Assuming user is attached to req by auth middleware
        const { page = 1, pageSize = 10 } = req.query;

        const { transactions, pagination } = await getTokenTransactionsByUserService(user._id, page, pageSize);
        
        res.status(200).json({
            status: 'success',
            data: {
                transactions,
                pagination
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error); // Pass custom AppError to error handling middleware
        }
        console.error('Error fetching token transactions:', error);
        return next(new AppError('An error occurred while fetching token transactions', 500));
    }
};

module.exports = {
    addPurchaseTokensController,
    getTokenTransactionsController
};