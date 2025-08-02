const { AppError } = require('../utils/error');
const { sanitize, generatePdfFromHtml } = require('../utils/helper');
const { generatePitchDeckService, createPitchDeckService, getUserPitchDecksService, getPitchDeckByIdService,
    deletePitchDeckService, updatePitchDeckService,
 } = require('../services/pitchDeckServices');
 const { uploadPdfService } = require('../services/uploadService');


// Controller to create a pitch deck
const createPitchDeckController = async (req, res, next) => {
    try {
        const { startUpName, problems, solutions, sector, industry, country, founders, features, slides } = req.body;

        // Validate required fields
        if (!startUpName || !problems || !solutions || !sector || !industry || !country || !founders || !features || !slides) {
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
        if (!Array.isArray(slides) || slides.length === 0) {
            throw new AppError('Slides must be a non-empty array', 400);
        }

        // Confirm slides are among allowed types
        const allowedSlides = ['cover', 'problem', 'solution', 'market', 'businessModel', 'goToMarket', 'competition',
            'team', 'features', 'financials', 'ask', 'exit', 'roadMap', 'socialImpact', 'personas', 'performanceMetrics'];
        for (const slide of slides) {
            if (!allowedSlides.includes(slide)) {
                throw new AppError(`Invalid slide type: ${slide}`, 400);
            }
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


// create pitch deck pdf controller
const createPitchDeckPdfController = async (req, res, next) => {
    try {
        const pitchDeckId = req.params.id;
        if (!pitchDeckId) {
            throw new AppError('Pitch deck ID is required', 400);
        }

        // Extract html template
        const template = req.body;
        if (!template) {
            throw new AppError('Template is required', 400);
        }

        // fetch pitch deck by ID
        const pitchDeck = await getPitchDeckByIdService(pitchDeckId);
        if (!pitchDeck) {
            throw new AppError('Pitch deck not found', 404);
        }

        // Convert html to pdf buffer
        const pdfBuffer = await generatePdfFromHtml(template);
        if (!pdfBuffer) {
            throw new AppError('Failed to generate PDF from HTML', 500);
        }
        // Covert pdf buffer to file
        const file = {
            buffer: pdfBuffer,
            originalname: `${pitchDeck.startUpName}-pitch-deck.pdf`,
            mimetype: 'application/pdf',
        };

        // Upload the PDF to S3
        const pdfUrl = await uploadPdfService(file);
        if (!pdfUrl) {
            throw new AppError('Failed to upload PDF', 500);
        }

        // Update the pitch deck with the PDF URL
        const updatedPitchDeck = await updatePitchDeckService(pitchDeckId, { pdfUrl });
        if (!updatedPitchDeck) {
            throw new AppError('Failed to update pitch deck with PDF URL', 500);
        }

        // Respond with pdfUrl and updated pitch deck object
        return res.status(200).json({
            status: 'success',
            message: 'Pitch deck PDF created successfully',
            data: {
                pdfUrl,
                pitchDeck: updatedPitchDeck.toObject(),
            },
        });
    } catch (error) {
        console.error('Error creating pitch deck PDF:', error);
        if (error instanceof AppError) {
            return next(error); // Pass AppError to the error handler
        }
        return next(new AppError('An error occurred while creating the pitch deck PDF', 500));
    }
};


// Export the controller
module.exports = {
    createPitchDeckController, getPitchDeckByIdController, deletePitchDeckController,
    createPitchDeckPdfController,
};