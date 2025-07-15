const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
    },
    bio:  {type: String },
    skills: [{ type: String}],
    startUpStory: {type: String},
    template: {type: String, default: "basic"}
    }, {timestamps: true});

    module.exports = mongoose.model ("Resume", resumeSchema);