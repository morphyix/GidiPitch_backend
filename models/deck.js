const mongoose = require('mongoose');


// Create function to get PDF URL from key
function getFileUrl(key) {
    if (!key) return null;
    return `${process.env.S3_CDN_URL}/${key}`;
};


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
    status: { type: String, enum: ['draft', 'generating', 'ready', 'editing', 'exporting', 'finalized', 'failed' ], default: 'draft' },
    slides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Slide' }],
    slideCount: { type: Number, default: 0 },
    pdfKey: { type: String },
    pptxKey: { type: String },
    progress: { type: Number, default: 0 },
    brandKit: {
        default: {
            background: { type: String },
            title: { type: String },
            bullets: { type: String },
            note: { type: String }
        },
        iconSlide: {
            background: { type: String },
            title: { type: String },
            bullets: { type: String },
            note: { type: String }
        }
    },
    error: { type: String },
    exportedAt: { type: Date },
    activityStatus: { type: String, default: 'All slides layout created, pending content generation' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual property to get the PDF URL from the key
DeckSchema.virtual('pdfUrl').get(function() {
    return getFileUrl(this.pdfKey);
});

// Virtual property to get the PPTX URL from the key
DeckSchema.virtual('pptxUrl').get(function() {
    return getFileUrl(this.pptxKey);
});

// Index for ownerId to optimize queries
DeckSchema.index({ ownerId: 1 });

// Index for status to optimize queries
DeckSchema.index({ status: 1 });
DeckSchema.index({ ownerId: 1, createdAt: -1 });
DeckSchema.index({ ownerId: 1, status: 1 });

const Deck = mongoose.model('Deck', DeckSchema, 'decks');

module.exports = Deck;