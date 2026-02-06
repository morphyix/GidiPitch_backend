const mongoose = require('mongoose');

// Count of times promotion has been applied
const promoCountSchema = new mongoose.Schema({
    name: { type: String, required: true },
    count: { type: Number, default: 0 },
    limit: { type: Number, default: 100 }, // Set a limit for the promotion
    rewardTokens: { type: Number, default: 0 }
}, { timestamps: true });


// Create unique index on name field
promoCountSchema.index({ name: 1 }, { unique: true });

const PromoCount = mongoose.model('PromoCount', promoCountSchema, 'promo_counts');

module.exports = PromoCount;