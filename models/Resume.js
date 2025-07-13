const mongoose = require("mongoose");

const resumeSchems = new mongppse.Schema({
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
    },
    bio:  {type: string },
    skills: [{ type: String}],
    startUpStory: {type: String},
    template: {type: string, default: "basic"}
    }, {timestamp: true});

    Module.exports = mongoose.model ("Resume", resumeSchema);