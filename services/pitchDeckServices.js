const { GoogleGenAI } = require('@google/genai');
const pitchDeck = require('../models/pitchDeck');
const { AppError } = require('../utils/error');


// Service to generate a pitch deck using Google Gemini AI
const generatePitchDeckService = async (startupData, deckSlides) => {
    try {
        if (!startupData || typeof startupData !== 'object') {
            throw new AppError('Invalid startup data provided', 400);
        }

        if (!deckSlides || !Array.isArray(deckSlides)) {
            throw new AppError('Invalid deck slides provided', 400);
        }
        
        // slides to be generated
        const slides = {
            cover: `
                Create a cover slide. Return only a valid JSON object with:
                - title: The pitch title
                - subtitle: A short tagline
                - design: A prompt for the design of the cover slide
                - example: A url to or file of an example cover slide`,
            problem: `
                Create a problem slide for a pitch deck, return:
                as a JSON object which would contain a problem key which is an array of strings which would contain the following informations:
                - The problem statement
                - The demograph affected by the problem
                - The impact of the problem on the demograph
                - The urgency of solving the problem
                - The current solutions and their limitations
                It would also contain a design JSON object with the following keys:
                - icons: An array of prompts to create icons which can visually represent the problem
                - design: A prompt for the design of the problem slide using the problem statements and icons`,
            solution: `
                Create a solution slide for a pitch deck using the business model and solutions provided, return:
                a JSON object with the following keys:
                firstly a solution key which is an array of strings that address the problems identified in the business model and solutions provided
                ,it would contain the following information:
                - The solution statement
                - How the solution addresses the problem
                - The unique value proposition of the solution
                - The benefits of the solution
                - The features of the solution
                It would also contain a design JSON object with the following keys:
                - icons: An array of prompts to create icons which can visually represent the solution
                - design: A prompt for the design of the solution slide using the solution statements and icons`,
            market: `
                Create a market slide for a pitch deck backed with current data for ${startupData.country} cite data sources, return:
                as a JSON object with the following keys:
                - title: The title of the market slide
                - totalMarketSize: The total market size in USD
                - TAM: The total addressable market in USD
                - SAM: The serviceable available market in USD
                - SOM: The serviceable obtainable market in USD
                - trends: emerging trends driving market growth
                - growthRate: The expected growth rate of the market
                - regulations: Any relevant regulations affecting the market
                - dataSources: An array of sources for the data used in the slide
                - graph: A prompt for the design of the market slide with a graph showing market growth
                - chart: A prompt for the design of the market slide with a chart showing market segmentation
                - design: A prompt for the overall design of the market slide
                - icons: An array of prompts to create icons which can visually represent the market
                - example: A url to or file of an example market slide`,
            features: `
                    Create a features slide for a pitch deck, return:
                    as a JSON array of objects with the following two keys:
                    - feature: The title of the features of the startup or product using information from ${startupData}
                    - description: a detailed description of the feature and how it solves the pain point of the user`,
            competition: `
                Create a competition slide for a pitch deck based on current data for ${startupData?.industry} ${startupData?.sector} in ${startupData.country}, return:
                as a JSON array of objects which would contain three objects with the following keys:
                - name: The name of the competitor
                - similarities: features that are similar to the startup
                - differences: features that are different from the startup
                - edge: The edge the startup has over the competitor
                - logo: The logo of the competitor
                It would also contain a design JSON object with the following keys:
                - design: A prompt for the design of the competition slide using the competitor data
                - example: A url to or file of an example competition slide`,
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