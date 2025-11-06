// Module for failed deck generation jobs
const mongoose = require('mongoose');


// Define the FailedDeckJob schema
const FailedDeckJobSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', required: true },
    slides: [{ type: mongoose.Schema.Types.Mixed }], // Array of slide data that failed
    error: { type: String, required: true }, // Error message
    jobId: { type: String }, // Optional job ID for reference
}, { timestamps: true });

// index userId and deckId
FailedDeckJobSchema.index({ userId: 1, deckId: 1 });

// index deckId
FailedDeckJobSchema.index({ deckId: 1 });

const FailedDeckJob = mongoose.model('FailedDeckJob', FailedDeckJobSchema, 'failed_deck_jobs');

module.exports = FailedDeckJob;