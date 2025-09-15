const mongoose = require('mongoose');
const { layout } = require('pdfkit/js/page');

// Define the Slide schema
const SlideSchema = new mongoose.Schema({
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    bullets: [{ type: String }],
    notes: { type: String },
    layout: { type: String, default: 'default' }, // e.g., 'title and bullets', 'image and text', etc.
    imagePrompt: { type: String }, // prompt used to generate image
    imageUrl: { type: String },
}, { timestamps: true });


// Index for deckId and order to optimize queries
SlideSchema.index({ deckId: 1, order: 1 }, { unique: true });

const Slide = mongoose.model('Slide', SlideSchema, 'slides');

module.exports = Slide;