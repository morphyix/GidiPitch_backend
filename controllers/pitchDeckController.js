const { AppError } = require('../utils/error');
const { sanitize } = require('../utils/helper');
const { generatePitchDeckService, createPitchDeckService, getUserPitchDecksService, getPitchDeckByIdService,
    deletePitchDeckService,
 } = require('../services/pitchDeckServices');


// Controller to create a pitch deck
const createPitchDeckController = async (req, res, next) => {
    try {
        const { startUpName, problems, solutions, sector, industry, country, founders, features } = req.body;

        // Validate required fields
        if (!startUpName || !problems || !solutions || !sector || !industry || !country || !founders || !features) {
            throw new AppError('All fields are required', 400);
        }
        if (!Array.isArray(founders) || founders.length === 0) {
            throw new AppError('Founders must be a non-empty array', 400);
        }
        if (!Array.isArray(features) || features.length === 0) {
            throw new AppError('Features must be a non-empty array', 400);
        }
        if (!Array.isArray(problems) || problems.length === 0) {
            throw new AppError('Problems must be a non-empty array', 400);
        }
        if (!Array.isArray(solutions) || solutions.length === 0) {
            throw new AppError('solutions must be a non-empty array', 400);
        }

        // Sanitize input
        const sanitizedData = {
            startUpName: sanitize(startUpName),
            problems: problems.map(p => sanitize(p)),
            solutions: solutions.map(s => sanitize(s)),
            sector: sanitize(sector),
            industry: sanitize(industry),
            country: sanitize(country),
            founders: founders.map(f => ({
                name: sanitize(f.name),
                role: sanitize(f.role),
                title: sanitize(f.title),
                linkedin: f.linkedin ? sanitize(f.linkedin) : undefined,
                twitter: f.twitter ? sanitize(f.twitter) : undefined,
            })),
            features: features.map(f => ({
                feature: sanitize(f.feature),
                description: sanitize(f.description)
            }))
        };

        // Generate pitch deck data
        const pitchDeckData = await generatePitchDeckService(sanitizedData);
        if (!pitchDeckData) {
            throw new AppError('Failed to generate pitch deck data', 500);
        }

        // Add pitch deck data to sanitizedData
        sanitizedData.pitchData = pitchDeckData;
        // Add user ID from request
        sanitizedData.user = req.user._id;
        if (!sanitizedData.user) {
            throw new AppError('User ID is required', 400);
        }
        console.log("sanitizedData: ", sanitizedData);
        // Create pitch deck in the database
        const pitchDeck = await createPitchDeckService(sanitizedData);
        if (!pitchDeck) {
            throw new AppError('Failed to create pitch deck', 500);
        }
        // Respond with the created pitch deck
        res.status(201).json({
            status: 'success',
            message: 'Pitch deck created successfully',
            data: {
                pitchDeck: pitchDeck.toObject(),
                slides: pitchDeckData
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error); // Pass AppError to the error handler
        }
        console.error('Error creating pitch deck:', error);
        return next(new AppError('An error occurred while creating the pitch deck', 500));
    }
};


// Controller to get user pitch decks
const getUserPitchDecksController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            throw new AppError('User ID is required', 400);
        }

        // Fetch user pitch decks
        const pitchDecks = await getUserPitchDecksService(userId);
        if (!pitchDecks || pitchDecks.length === 0) {
            return res.status(404).json({
                status: 'success',
                message: 'No pitch decks found for this user',
                data: { pitchDecks: [] }
            });
        }

        // Respond with the user's pitch decks
        res.status(200).json({
            status: 'success',
            message: 'User pitch decks fetched successfully',
            data: { pitchDecks }
        });
    } catch (error) {
        console.error('Error fetching user pitch decks:', error);
        if (error instanceof AppError) {
            return next(error); // Pass AppError to the error handler
        }
        return next(new AppError('An error occurred while fetching user pitch decks', 500));
    }
};


// Controller to get a specific pitch deck by ID
const getPitchDeckByIdController = async (req, res, next) => {
    try {
        const pitchDeckId = req.params.id;
        if (!pitchDeckId) {
            throw new AppError('Pitch deck ID is required', 400);
        }
        // Fetch pitch deck by ID
        const pitchDeck = await getPitchDeckByIdService(pitchDeckId);
        if (!pitchDeck) {
            throw new AppError('Pitch deck not found', 404);
        }
        // Respond with the pitch deck data
        res.status(200).json({
            status: 'success',
            message: 'Pitch deck fetched successfully',
            data: { pitchDeck }
        });
    } catch (error) {
        console.error('Error fetching pitch deck by ID:', error);
        if (error instanceof AppError) {
            return next(error); // Pass AppError to the error handler
        }
        return next(new AppError('An error occurred while fetching the pitch deck', 500));
    }
};


// Controller to delete a specific pitch deck by ID
const deletePitchDeckController = async (req, res, next) => {
    try {
        const pitchDeckId = req.params.id;
        if (!pitchDeckId) {
            throw new AppError('Pitch deck ID is required', 400);
        }
        // Delete pitch deck by ID
        const deletedDeck = await deletePitchDeckService(pitchDeckId);
        if (!deletedDeck) {
            throw new AppError('Pitch deck not found', 404);
        }
        // Respond with success message
        res.status(200).json({
            status: 'success',
            message: 'Pitch deck deleted successfully',
            data: { deletedDeck }
        });
    } catch (error) {
        console.error('Error deleting pitch deck:', error);
        if (error instanceof AppError) {
            return next(error); // Pass AppError to the error handler
        }
        return next(new AppError('An error occurred while deleting the pitch deck', 500));
    }
};


// Export the controller
module.exports = {
    createPitchDeckController, getUserPitchDecksController, getPitchDeckByIdController, deletePitchDeckController,
};