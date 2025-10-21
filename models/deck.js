const mongoose = require('mongoose');


// Define the Deck schema
const DeckSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startupName: { type: String, required: true },
    industry: { type: String },
    scope: { type: String },
    problems: { type: String },
    solutions: { type: String },
    features: { type: String },
    moreInfo: { type: String },
    imageGenType: { type: String, enum: ['manual', 'ai'], default: 'ai' },
    brandColor: { type: String },
    brandStyle: { type: String },
    competition: { type: String },
    businessModel: { type: String },
    team: [{ name: { type: String }, role: { type: String }, expertise: { type: String } }],
    status: { type: String, enum: ['draft', 'generating', 'ready', 'editing', 'finalized', 'failed' ], default: 'draft' },
    slides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Slide' }],
    slideCount: { type: Number, default: 0 },
    PDFUrl: { type: String },
    pptxUrl: { type: String },
    progress: { type: Number, default: 0 },
    error: { type: String },
    activityStatus: { type: String, default: 'All slides layout created, pending content generation' },
}, { timestamps: true });

// Index for ownerId to optimize queries
DeckSchema.index({ ownerId: 1 });

// Index for status to optimize queries
DeckSchema.index({ status: 1 });
DeckSchema.index({ ownerId: 1, createdAt: -1 });

const Deck = mongoose.model('Deck', DeckSchema, 'decks');

module.exports = Deck;