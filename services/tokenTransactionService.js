const mongoose = require('mongoose');
const TokenTransaction = require('../models/tokenTransaction');
const { AppError } = require('../utils/error');

const TRANSACTION_TYPES = ['add', 'deduct', 'refund'];

// Service to create a new token transaction
const createTokenTransactionService = async (userId, type, amount, quantity, balanceAfter, paymentMethod, operation, session=null, jobId) => {
  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid or missing user ID', 400);
    }
    if (!TRANSACTION_TYPES.includes(type)) {
      throw new AppError('Invalid transaction type', 400);
    }
    if (amount <= 0 && type === 'add') {
      throw new AppError('Invalid transaction amount', 400);
    }
    if (balanceAfter < 0 && type === 'add') {
      throw new AppError('Invalid balance after transaction', 400);
    }
    if (quantity <= 0) {
      throw new AppError('Invalid transaction quantity', 400);
    }

    const transactionLog = {
      userId,
      type,
      quantity,
    }

    if (operation) {
      transactionLog.operation = operation;
    }

    if (type === 'add') {
      transactionLog.amount = amount;
      transactionLog.balanceAfter = balanceAfter;
      transactionLog.paymentMethod = paymentMethod;
    }

    if ((type === 'deduct' || type === 'refund') && jobId) {
      transactionLog.jobId = jobId;
    }

    const options = session ? { session } : {};

    const newTransaction = await TokenTransaction.create(transactionLog, options);

    return newTransaction;
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('Error creating token transaction:', error);
    throw new AppError('Error creating token transaction', 500);
  }
};


// Service to get token transactions for a user with pagination
const getTokenTransactionsByUserService = async (userId, page = 1, pageSize = 10) => {
  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid or missing user ID', 400);
    }

    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);

    const skip = (page - 1) * pageSize;

    const [transactions, totalCount] = await Promise.all([
      TokenTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      TokenTransaction.countDocuments({ userId }),
    ]);

    return {
      transactions,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('Error fetching token transactions:', error);
    throw new AppError('Error fetching token transactions', 500);
  }
};


// Export the service functions
module.exports = {
  createTokenTransactionService,
  getTokenTransactionsByUserService,
};
