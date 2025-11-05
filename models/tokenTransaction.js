const mongoose = require('mongoose');


const TokenTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['add', 'deduct', 'refund'], required: true },
    paymentMethod: { type: String, enum: ['paystack', 'crypto', 'none'], default: 'none' },
    amount: { type: Number, required: function() { return this.type === 'add' }, default: 0 },
    quantity: { type: Number, required: true },
    operation: { type: String, default: 'token purchase'},
    balanceAfter: { type: Number, required: function() { return this.type === 'add' } },
    jobId: { type: String, required: function() { return ['deduct', 'refund'].includes(this.type)  } },
}, { timestamps: true });

// Prevent multiple user transactions with the same jobId
TokenTransactionSchema.index({ userId: 1, jobId: 1, type: 1 }, { unique: true, sparse: true });

// Create index for token transactions by userId
TokenTransactionSchema.index({ userId: 1, createdAt: -1 });

const TokenTransaction = mongoose.model('TokenTransaction', TokenTransactionSchema, 'TokenTransactions');

module.exports = TokenTransaction;