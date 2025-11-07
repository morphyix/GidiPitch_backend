const mongoose = require('mongoose');


// Define the FailedSlideJob schema
const FailedSlideJobSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slide', required: true },
    prompt: { type: String, required: true }, // Correction prompt that failed
    error: { type: String }, // Error message
    jobId: { type: String }, // Optional job ID for reference
}, { timestamps: true });

// index userId and slideId
FailedSlideJobSchema.index({ userId: 1, slideId: 1 });

// index slideId
FailedSlideJobSchema.index({ slideId: 1 });

const FailedSlideJob = mongoose.model('FailedSlideJob', FailedSlideJobSchema, 'failed_slide_jobs');

module.exports = FailedSlideJob;