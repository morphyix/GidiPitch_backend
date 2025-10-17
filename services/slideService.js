const Slide = require('../models/slide');
const { AppError } = require('../utils/error');


// Service to create a new slide
const createSlideService = async (slideData) => {
    try {
        if (!slideData || typeof slideData !== 'object') {
            throw new AppError('Invalid slide data provided', 400);
        }

        const newSlide = await Slide.create(slideData);
        return newSlide;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error creating slide:', error);
        throw new AppError('Failed to create slide', 500);
    }
};


// Service to get a slide by ID
const getSlideByIdService = async (slideId) => {
    try {
        if (!slideId) {
            throw new AppError('Slide ID is required', 400);
        }

        const slide = await Slide.findById(slideId);
        if (!slide) {
            throw new AppError('Slide not found', 404);
        }
        return slide;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error fetching slide:', error);
        throw new AppError('Failed to fetch slide', 500);
    }
};


// Get all slides for a specific deck
const getSlidesByDeckIdService = async (deckId) => {
    try {
        if (!deckId) {
            throw new AppError('Deck ID is required', 400);
        }

        const slides = await Slide.find({ deckId }).sort({ createdAt: 1 });
        return slides;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error fetching slides:', error);
        throw new AppError('Failed to fetch slides', 500);
    }
};


// Service to update a slide by ID
const updateSlideByIdService = async (slideId, updateData) => {
    try {
        if (!slideId) {
            throw new AppError('Slide ID is required', 400);
        }
        if (!updateData || typeof updateData !== 'object') {
            throw new AppError('Invalid update data provided', 400);
        }
        
        // fields not allowed to be updated
        const forbiddenFields = ['_id', 'createdAt', 'deckId'];
        forbiddenFields.forEach(field => delete updateData[field]);

        const updatedSlide = await Slide.findByIdAndUpdate(slideId, updateData, { new: true });
        if (!updatedSlide) {
            throw new AppError('Slide not found or update failed', 404);
        }
        return updatedSlide;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error updating slide:', error);
        throw new AppError('Failed to update slide', 500);
    }
};


// Service to delete a slide by ID
const deleteSlideByIdService = async (slideId) => {
    try {
        if (!slideId) {
            throw new AppError('Slide ID is required', 400);
        }

        const deletedSlide = await Slide.findByIdAndDelete(slideId);
        if (!deletedSlide) {
            throw new AppError('Slide not found or delete failed', 404);
        }
        return true;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error deleting slide:', error);
        throw new AppError('Failed to delete slide', 500);
    }
};


// Update slide image service
const updateSlideImageService = async (slideId, imageIndex, imageData) => {
    try {
        if (!slideId) throw new AppError('Slide ID is required', 400);
        if (typeof imageIndex !== 'number' || imageIndex < 0) {
            throw new AppError('Invalid image index', 400);
        }
        if (!imageData || typeof imageData !== 'object') {
            throw new AppError('Invalid image data provided', 400);
        }

        // Build dynamic field paths for update
        const updateFields = {};
        for (const [key, value] of Object.entries(imageData)) {
            updateFields[`images.${imageIndex}.${key}`] = value;
        }

        // Perform the update
        const updatedSlide = await Slide.findByIdAndUpdate(
            slideId,
            { $set: updateFields },
            { new: true }
        );

        if (!updatedSlide) {
            throw new AppError('Slide not found or image update failed', 404);
        }
        return updatedSlide;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error updating slide image:', error);
        throw new AppError('Failed to update slide image', 500);
    }
};


// export services
module.exports = {
    createSlideService,
    getSlideByIdService,
    getSlidesByDeckIdService,
    updateSlideByIdService,
    deleteSlideByIdService,
    updateSlideImageService,
};