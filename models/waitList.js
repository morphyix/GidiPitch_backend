const mongoose = require('mongoose');


const WaitListSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
}, { timestamps: true });

const WaitList = mongoose.model('WaitList', WaitListSchema);
// Export the WaitList model
module.exports = WaitList;