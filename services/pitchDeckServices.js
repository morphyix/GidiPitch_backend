const { GoogleGenAI } = require('@google/genai');
const pitchDeck = require('../models/pitchDeck');
const { AppError } = require('../utils/error');


// Service to generate a pitch deck using Google Gemini AI
const generatePitchDeckService = async (startupData) => {
    try {
        if (!startupData || typeof startupData !== 'object') {
            throw new AppError('Invalid startup data provided', 400);
        }
        
        // slides to be generated
        const slides = {
            cover: `
                Create a cover slide. Return only a valid JSON object with:
                - title: The pitch title
                - subtitle: A short tagline
                - founders: An array of founder names`,
            problem: `
                Create a problem slide for a pitch deck, return:
                as a JSON array of objects with the following keys:
                - title: The title of the problem
                - description: A detailed description of the problem`,
            solution: `
                Create a solution slide for a pitch deck, return:
                as a JSON array of objects with the following two keys:
                - title: The title of the solution
                - description: A detailed description of the solution`,
            market: `
                Create a market slide for a pitch deck backed with current data for ${startupData.country}, return:
                as a JSON object with the following keys:
                - title: The title of the market
                - description: A detailed description of the market
                - size: The estimated market size with figures and sources
                - growthRate: The expected growth rate of the market
                - productFit: How product aligns and targets the market`,
            features: `
                    Create a features slide for a pitch deck, return:
                    as a JSON array of objects with the following two keys:
                    - title: The title of the features
                    - features: An object containing key features of the product with descriptions on how they solve the problem`,
            competition: `
                Create a competition slide for a pitch deck based on current data for ${startupData.industry} ${startupData.sector} in ${startupData.country}, return:
                as a JSON array of objects with the following keys:
                - title: The title of the competition
                - competitors: An array of competitor names
                - strengths: An array of strengths of the product compared to competitors
                - weaknesses: An array of weaknesses of the product compared to competitors`,
            businessModel: `
                Create a business model slide for a pitch deck, return:
                as a JSON object with the following keys:
                - title: The title of the business model
                - description: A detailed description of the business model
                - revenueStreams: An array of revenue streams`,
            goToMarket: `
                Create a go-to-market slide for a pitch deck, return:
                as a JSON array of objects with the following keys:
                - title: The title of the go-to-market strategy
                - description: A detailed description of the go-to-market strategy
                - channels: An array of channels to reach customers`,
            team: `
                Create a team slide for a pitch deck, return:
                as a JSON array of objects with the following keys:
                - title: The title of the team
                - members: An array of team member objects with name, role, title and social links`,
            roadMap: `
                Create a roadmap slide for a pitch deck, return:
                as a JSON array of objects with the following keys:
                - title: The title of the roadmap
                - milestones: An array of milestones with dates and descriptions`,
        };

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
        // Generate slides using Google Gemini AI
        const pitchDeckData = {};
        for (const [key, prompt] of Object.entries(slides)) {
            const fullPrompt = `
                You are a pitch deck expert. ${prompt}
                Here is the startup data:
                ${JSON.stringify(startupData)}
                Return only a valid JSON object with no extra text or explanation or markdowns.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            });
            console.log("response.text: ", response.text);
            let text = response.text;
            text = text.replace(/```json|```/g, '').trim();

            try {
                pitchDeckData[key] = JSON.parse(text);
            } catch (err) {
                console.error(`Error parsing gemini response for ${key}:`, err);
                throw new AppError(`Failed to parse response for ${key}`, 500);
            }
        }
        return pitchDeckData;
    } catch (error) {
        console.error('Error generating pitch deck:', error);
        throw new AppError('Failed to generate pitch deck', 500);
    }
};


// Create a new pitch deck entry in the database
const createPitchDeckService = async (pitchDeckData) => {
    try {
        if (!pitchDeckData || typeof pitchDeckData !== 'object') {
            throw new AppError('Invalid pitch deck data provided', 400);
        }

        // Check if the pitch deck already exists
        const existingDeck = await pitchDeck.findOne({ startUpName: pitchDeckData.startUpName, user: pitchDeckData.user });
        if (existingDeck) {
            throw new AppError('Pitch deck for this startup already exists', 400);
        }
        // Create a new pitch deck
        const newPitchDeck = new pitchDeck(pitchDeckData);
        await newPitchDeck.save();
        return newPitchDeck;
    } catch (error) {
        console.error('Error creating pitch deck:', error);
        if (error instanceof AppError) throw error; // Re-throw AppError for handling in the controller
        throw new AppError('Failed to create pitch deck', 500);
    }
};


// Get user pitch decks
const getUserPitchDecksService = async (userId) => {
    try {
        if (!userId) {
            throw new AppError('User ID is required', 400);
        }
        const pitchDecks = await pitchDeck.find({ user: userId }).sort({ createdAt: -1 });
        return pitchDecks;
    } catch (error) {
        console.error('Error fetching user pitch decks:', error);
        throw new AppError('Failed to fetch user pitch decks', 500);
    }
};


// Get a specific pitch deck by ID
const getPitchDeckByIdService = async (pitchDeckId) => {
    try {
        if (!pitchDeckId) {
            throw new AppError('Pitch deck ID is required', 400);
        }
        const pitchDeckData = await pitchDeck.findById(pitchDeckId);
        if (!pitchDeckData) {
            throw new AppError('Pitch deck not found', 404);
        }
        return pitchDeckData;
    } catch (error) {
        console.error('Error fetching pitch deck by ID:', error);
        if (error instanceof AppError) throw error; // Re-throw AppError for handling in the controller
        throw new AppError('Failed to fetch pitch deck', 500);
    }
};


// Delete a specific pitch deck by ID
const deletePitchDeckService = async (pitchDeckId) => {
    try {
        if (!pitchDeckId) {
            throw new AppError('Pitch deck ID is required', 400);
        }
        const deletedDeck = await pitchDeck.findByIdAndDelete(pitchDeckId);
        if (!deletedDeck) {
            throw new AppError('Pitch deck not found', 404);
        }
        return deletedDeck;
    } catch (error) {
        console.error('Error deleting pitch deck:', error);
        if (error instanceof AppError) throw error; // Re-throw AppError for handling in the controller
        throw new AppError('Failed to delete pitch deck', 500);
    }
};


// Update pitch deck service to include slides
const updatePitchDeckService = async (pitchDeckId, updates) => {
    try {
        if (!pitchDeckId || !updates || typeof updates !== 'object') {
            throw new AppError('Invalid pitch deck ID or updates provided', 400);
        }

        // Find and update the pitch deck
        const updatedDeck = await pitchDeck.findByIdAndUpdate(pitchDeckId, updates, { new: true });
        if (!updatedDeck) {
            throw new AppError('Pitch deck not found', 404);
        }
        return updatedDeck;
    } catch (error) {
        console.error('Error updating pitch deck:', error);
        if (error instanceof AppError) throw error; // Re-throw AppError for handling in the controller
        throw new AppError('Failed to update pitch deck', 500);
    }
};


// Export the service
module.exports = {
    generatePitchDeckService,
    createPitchDeckService,
    getUserPitchDecksService,
    getPitchDeckByIdService,
    deletePitchDeckService,
    updatePitchDeckService,
};