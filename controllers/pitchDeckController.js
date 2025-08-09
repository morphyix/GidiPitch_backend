const { AppError } = require('../utils/error');
const { sanitize, generatePdfFromHtml } = require('../utils/helper');
const { generatePitchDeckService, createPitchDeckService, getUserPitchDecksService, getPitchDeckByIdService,
    deletePitchDeckService, updatePitchDeckService,
 } = require('../services/pitchDeckServices');
 const { uploadPdfService } = require('../services/uploadService');


// Controller to create a pitch deck
const createPitchDeckController = async (req, res, next) => {
    try {
        const { startupName, description, features, problems, solutions, businessModel, industry, sector,
            country, competitors, askAmount, totalInvestment, team, milestones, slides,
        } = req.body;

        if (!startupName || !description || !features || !problems || !solutions || !businessModel ||
            !industry || !country || !competitors || !askAmount || !totalInvestment || !team || !milestones) {
            throw new AppError('All fields are required', 400);
        }

        if (slides && !Array.isArray(slides)) {
            throw new AppError('Slides must be an array', 400);
        }
        if (!Array.isArray(features) || !Array.isArray(problems) || !Array.isArray(solution) ||
            !Array.isArray(team) || !Array.isArray(milestones)) {
            throw new AppError('Features, problems, solutions, team, and milestones must be arrays', 400);
        }
        // Check slides length
        if (slides.length === 0) {
            throw new AppError("please select at least ten pitch deckslide to be generated", 400);
        }

        // Verify pitch deck slides
        const allowedSlides = ['cover', 'vision', 'problem', 'solution', 'market', 'businessModel', 'goToMarket',
            'competition', 'team', 'financials', 'ask', 'milestones', 'productDemo', 'targetCustomers', 
            'traction', 'testimonials', 'exitStrategy', 'callToAction', 'thankYou', 'caseStudies', 'contactInfo',
        ];

        const deckSlides = slides.filter(slide => allowedSlides.includes(slide));

        // validate input data
        const startupData = {
            startupName: sanitize(startupName),
            description: sanitize(description),
            features: features.map(feature => ({
                feature: sanitize(feature.feature),
                description: sanitize(feature.description)
            })),
            problems: problems.map(problem => sanitize(problem)),
            solutions: solutions.map(solution => sanitize(solution)),
            businessModel: sanitize(businessModel),
            industry: sanitize(industry),
            competitors: competitors.map(competitor => sanitize(competitor)),
            team: team.map(member => ({
                name: sanitize(member.name),
                role: sanitize(member.role),
                title: sanitize(member.title),
                linkedin: member.linkedin ? sanitize(member.linkedin) : '',
                twitter: member.twitter ? sanitize(member.twitter) : '',
            })),
            country: sanitize(country),
            askAmount: parseInt(askAmount, 10),
            totalInvestment: parseInt(totalInvestment, 10),
            milestones: milestones.map(milestone => ({
                title: sanitize(milestone.title),
                description: sanitize(milestone.description),
                date: new Date(milestone.date),
            })),
        };

        if (sector) {
            startupData.sector = sanitize(sector);
        }

        // Generate Pitch Deck
        const pitchDeckData = await generatePitchDeckService(startupData, deckSlides);
        if (!pitchDeckData) {
            throw new AppError('Failed to generate pitch deck', 500);
        }

        // Create Pitch Deck
        const pitchDeck = await createPitchDeckService({
            user: req.user._id,
            startUpName: startupData.startupName,
            problems: startupData.problems,
            solutions: startupData.solutions,
            sector: startupData.sector || '',
            industry: startupData.industry,
            country: startupData.country,
            founders: startupData.team,
            features: startupData.features,
            pitchData: pitchDeckData,
        });
        if (!pitchDeck) {
            throw new AppError('Failed to create pitch deck', 500);
        }
        // Respond with the created pitch deck
        res.status(201).json({
            status: 'success',
            message: 'Pitch deck created successfully',
            data: { pitchDeck: pitchDeck.toObject() },
        });
    } catch (error) {
        console.error('Error creating pitch deck:', error);
        if (error instanceof AppError) {
            return next(error); // Pass AppError to the error handler
        }
        return next(new AppError('An error occurred while creating the pitch deck', 500));
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