const mongoose = require('mongoose');
const { captureOwnerStack } = require('react');


// Define the image schema
const ImageSchema = new mongoose.Schema({
    prompt: { type: String },
    key: { type: String },
    caption: { type: String },
    source: { type: String, enum: [ 'ai-generated', 'user-uploaded' ], default: 'ai-generated' },
    status: { type: String, enum: [ 'pending', 'completed', 'failed' ], default: 'pending' },
    isSelected: { type: Boolean, default: false }
}, { _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// function to get image URL from key
function getImageUrl(key) {
    if (!key) return null;
    return `${process.env.S3_CDN_URL}/${key}`;
};

// Virtual property to get the image URL from the key
ImageSchema.virtual('url').get(function() {
    return getImageUrl(this.key);
});

ImageSchema.methods.toJSON = function() {
    const obj = this.toObject();
    obj.url = getImageUrl(this.key);
    delete obj.key; // Remove the key from the output
    return obj;
}

// Define the Slide schema
const SlideSchema = new mongoose.Schema({
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    bullets: [{ type: String }],
    notes: { type: String },
    layout: { type: String, enum: ['default', 'title-bullets', 'image-text', 'full-image'], default: 'default' }, // e.g., 'title and bullets', 'image and text', etc.
    images: [ImageSchema],
}, { timestamps: true });


// Index for deckId and order to optimize queries
SlideSchema.index({ deckId: 1, order: 1 }, { unique: true });

const Slide = mongoose.model('Slide', SlideSchema, 'slides');

module.exports = Slide;