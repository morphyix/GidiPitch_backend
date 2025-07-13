const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    password: { type: String, required: function() { return this.authProvider === 'local'; } },
    authProvider: { type: String, enum: ['google', 'local'], default: 'local' },
    socialId: { type: String, unique: true, sparse: true }, // For social logins
    emailVerified: { type: Boolean, default: false },
}, { timestamps: true });

// add index for email, authProvider, and socialId
UserSchema.index({ authProvider: 1, socialId: 1 }, { unique: true, partialFilterExpression: {
    socialId: { $exists: true, $ne: null }
} });

// Create a User model from the schema
const User = mongoose.model('User', UserSchema);

// Export the User model
module.exports = User;