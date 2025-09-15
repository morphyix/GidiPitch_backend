const mongoose = require('mongoose');


// Define the Deck schema
const DeckSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startupName: { type: String, required: true },
    industry: { type: String },
    scope: { type: String },
    problems: { type: String },
    solutions: { type: String },
    competition: { type: String },
    businessModel: { type: String },
    milestones: { type: String },
    financials: { type: String },
    ask: { type: String },
    team: [{ name: { type: String }, role: { type: String } }],
    status: { type: String, enum: ['draft', 'generating', 'ready', 'editing', 'finalized' ], default: 'draft' },
    slides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Slide' }],
    PDFUrl: { type: String },
    pptxUrl: { type: String },
}, { timestamps: true });

// Index for ownerId to optimize queries
DeckSchema.index({ ownerId: 1 });

// Index for status to optimize queries
DeckSchema.index({ status: 1 });

const Deck = mongoose.model('Deck', DeckSchema, 'decks');

module.exports = Deck;