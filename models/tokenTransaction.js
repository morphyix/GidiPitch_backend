const mongoose = require('mongoose');


const TokenTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['add', 'deduct'], required: true },
    paymentMethod: { type: String, enum: ['paystack', 'crypto', 'none'], default: 'none' },
    amount: { type: Number, required: true },
    quantity: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
}, { timestamps: true });

// Create index for token transactions by userId
TokenTransactionSchema.index({ userId: 1, createdAt: -1 });

const TokenTransaction = mongoose.model('TokenTransaction', TokenTransactionSchema, 'TokenTransactions');

module.exports = TokenTransaction;