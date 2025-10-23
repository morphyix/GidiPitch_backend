const Deck = require('../models/deck');
const { AppError } = require('../utils/error');


// Service to create a new deck
const createDeckService = async (deckData) => {
    try {
        if (!deckData || typeof deckData !== 'object') {
            throw new AppError('Invalid deck data provided', 400);
        }

        const newDeck = await Deck.create(deckData);
        return newDeck;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error creating deck:', error);
        throw new AppError('Failed to create deck', 500);
    }
};


// Service to get a deck by ID
const getDeckByIdService = async (deckId) => {
    try {
        if (!deckId) {
            throw new AppError('Deck ID is required', 400);
        }

        const deck = await Deck.findById(deckId);
        if (!deck) {
            throw new AppError('Deck not found', 404);
        }
        return deck;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error fetching deck:', error);
        throw new AppError('Failed to fetch deck', 500);
    }
};


// Service to update a deck by ID
const updateDeckByIdService = async (deckId, updateData) => {
    try {
        if (!deckId) {
            throw new AppError('Deck ID is required', 400);
        }
        if (!updateData || typeof updateData !== 'object') {
            throw new AppError('Invalid update data provided', 400);
        }

        // fields not allowed to be updated
        const forbiddenFields = ['_id', 'createdAt', 'ownerId'];
        forbiddenFields.forEach(field => delete updateData[field]);

        const updatedDeck = await Deck.findByIdAndUpdate(deckId, updateData, { new: true });
        if (!updatedDeck) {
            throw new AppError('Deck not found or update failed', 404);
        }
        return updatedDeck;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error updating deck:', error);
        throw new AppError('Failed to update deck', 500);
    }
};


// Service to delete a deck by ID
const deleteDeckByIdService = async (deckId) => {
    try {
        if (!deckId) {
            throw new AppError('Deck ID is required', 400);
        }

        const deletedDeck = await Deck.findByIdAndDelete(deckId);
        if (!deletedDeck) {
            throw new AppError('Deck not found or delete failed', 404);
        }
        return true;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error deleting deck:', error);
        throw new AppError('Failed to delete deck', 500);
    }
};


// Get all users decks
const getUserDecksService = async (userId) => {
    try {
        if (!userId) {
            throw new AppError('User ID is required', 400);
        }

        const decks = await Deck.find({ ownerId: userId }).sort({ createdAt: -1 });
        return decks;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error fetching user decks:', error);
        throw new AppError('Failed to fetch user decks', 500);
    }
};

// export services
module.exports = {
    createDeckService,
    getDeckByIdService,
    updateDeckByIdService,
    deleteDeckByIdService,
    getUserDecksService
};