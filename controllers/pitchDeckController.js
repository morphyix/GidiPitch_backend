const { AppError } = require('../utils/error');
const { sanitize, generatePdfFromHtml } = require('../utils/helper');
const { generatePitchDeckService, createPitchDeckService, getUserPitchDecksService, getPitchDeckByIdService,
    deletePitchDeckService, updatePitchDeckService,
 } = require('../services/pitchDeckServices');
 const { uploadPdfService } = require('../services/uploadService');


// Controller to create a pitch deck
const createPitchDeckController = async (req, res, next) => {
    try {
        
    } catch (error) {

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
    createPitchDeckController, getUserPitchDecksController, getPitchDeckByIdController, deletePitchDeckController,
    createPitchDeckPdfController,
};