const mongoose = require('mongoose');


const pitchDeckSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startUpName: { type: String, required: true },
    problems: { type: [String], required: true },
    solutions: { type: [String], required: true },
    sector: { type: String, required: true },
    industry: { type: String, required: true },
    country : { type: String, required: true },
    founders: [{
        name: { type: String, required: true },
        role: { type: String, required: true },
        title: { type: String, required: true },
        linkedin: { type: String, required: false },
        twitter: { type: String, required: false },
    }],
    features: [{
        feature: { type: String, required: true },
        description: { type: String, required: true }
    }],
    pitchData: {
        type: Object,
    },
    pdfUrl: { type: String, required: false }
}, { timestamps: true });

// Add an index for user
pitchDeckSchema.index({ user: 1 });
// Add an index for startUpName
pitchDeckSchema.index({ startUpName: 1 });

// Create a PitchDeck model from the schema
const PitchDeck = mongoose.model('PitchDeck', pitchDeckSchema);

// Export the PitchDeck model
module.exports = PitchDeck;