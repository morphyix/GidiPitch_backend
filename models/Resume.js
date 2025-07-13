const mongoose = require("mongoose");
const { link } = require("../app");

const resumeSchema = new mongoose.Schema({
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
    },

    fullName: {type: String, required: true},
    title:{type: String, default: "Founder / CEO"},
    bio:  {type: string, required: String},
    startups: [{
        name: String,
        description: String,
        role : String,
        startDate: String,
        endDate: String,
        traction: String // e.g., Grew to 10k users in 6 months
    }],
        startUpStory: {type: String},
    education: [
        {
            school: String,
            degree: String,
            field: String,
            year: String
        }
    ],
    skills: [{ type: String}],
    links: {
        linkedIn: String,
        github: String,
        website: String,
        pitchDeckUrl: String
    },
    template: {type: string, default: "basic"}
    }, {timestamp: true});

    Module.exports = mongoose.model ("Resume", resumeSchema);