const { createDeckService, updateDeckByIdService, getDeckByIdService, getUserDecksService, deleteDeckByIdService } = require('../services/deckService');
const { createSlideService, getSlidesByDeckIdService, getSlideByIdService, deleteSlideByIdService } = require('../services/slideService');
const { addPitchDeckJob } = require('../jobs/pitchDeckGenerator/queue');
const { generatePromptsForSlides, getAllowedSlides, generateCorrectionPrompt, createTailwindPrompt } = require('../utils/generatePitchPrompts');
const { AppError } = require('../utils/error');
const { sanitize } = require('../utils/helper');
const { addSlideCorrectionJob } = require('../jobs/slideCorrection/queue');
const { addExportJob } = require('../jobs/exportDeck/queue');
const { deleteFileService } = require('../services/uploadService');


// Controller to handle pitch deck creation request
const createPitchDeckController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const body = req.body;
        if (!body) {
            return next(new AppError('Request body is missing', 400));
        }

        if (!Array.isArray(body.slides) || body.slides.length === 0) {
            return next(new AppError('Slides array is required and cannot be empty', 400));
        }

        const { startupName, industry, scope, problems, solutions, imageGenType, brandColor, brandStyle,
            competitions, businessModel, team, moreInfo, features } = body;
        
        if (!startupName || !industry || !scope || !problems || !solutions || !competitions || !businessModel || !team || !Array.isArray(team) || team.length === 0 || !features) {
            return next(new AppError('All startup details are required to create a pitch deck', 400));
        }
        if (!imageGenType || (imageGenType !== 'manual' && imageGenType !== 'ai')) {
            return next(new AppError("imageGenType is required and must be either 'manual' or 'ai'", 400));
        }

        // Check if slides is in allowed slides
        const allowedSlides = getAllowedSlides(industry);
        for (const slide of body.slides) {
            if (!allowedSlides.includes(slide)) {
                return next(new AppError(`Slide type '${slide}' is not allowed for the industry '${industry}'`, 400));
            }
        }

        // Create startup data object
        const startupData = {
            startupName: sanitize(startupName),
            industry: sanitize(industry),
            scope: sanitize(scope),
            problems: sanitize(problems),
            solutions: sanitize(solutions),
            features: sanitize(features),
            moreInfo: moreInfo ? sanitize(moreInfo) : '',
            competitions: sanitize(competitions),
            businessModel: sanitize(businessModel),
            team: team.map(member => ({
                name: sanitize(member.name),
                role: sanitize(member.role),
                expertise: member.expertise ? sanitize(member.expertise) : '',
            })),
            imageGenType: sanitize(imageGenType),
            brandColor: brandColor ? sanitize(brandColor) : '',
            brandStyle: brandStyle ? sanitize(brandStyle) : '',
        };

        // Generate prompts for each slide
        const prompts = generatePromptsForSlides(startupData, body.slides);
        if (!prompts || Object.keys(prompts).length === 0) {
            return next(new AppError('Failed to generate prompts for the selected slides', 500));
        }

        // Create BrandKit prompt
        const tailwindPrompt = createTailwindPrompt(brandColor, brandStyle);
        if (!tailwindPrompt) {
            return next(new AppError('Failed to generate Tailwind CSS prompt for brand kit', 500));
        }

        // Create a new deck entry in the database with status 'draft'
        startupData.ownerId = userId;
        startupData.status = 'draft';
        const newDeck = await createDeckService(startupData);
        const deckSlides = {};
        let deckProgress = 0;
        let slideCount = 0;

        // Create all slide entries in the database with status 'pending'
        for (const key of Object.keys(prompts)) {
            const newSlide = await createSlideService({
                deckId: newDeck._id,
                slideType: key,
                order: slideCount,
                title: key,
                status: 'pending',
                progress: 10,
            });
            deckSlides[key] = newSlide._id;
            slideCount++;
            deckProgress += 10; // Each slide creation adds 10% to the deck progress
            await updateDeckByIdService(newDeck._id, {
                slides: Object.values(deckSlides),
                slideCount,
                progress: Math.floor(deckProgress / slideCount)
            });
        }
        // Add a job to the pitch deck generation queue
        const jobData = {
            deckId: newDeck._id,
            prompts,
            startupData,
            deckSlides,
            imageGenType,
            tailwindPrompt,
            userId
        };

        await addPitchDeckJob(jobData);

        res.status(201).json({
            status: 'success',
            message: 'Pitch deck creation initiated',
            data: {
                deckId: newDeck._id,
                slideCount,
                slides: deckSlides,
                progress: Math.floor(deckProgress / slideCount),
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        next(new AppError(error.message, 500));
    }
};


// Track pitch deck generation progress and return generated slides
const getPitchDeckProgressController = async (req, res, next) => {
    try {
        const { deckId } = req.params;
        if (!deckId) {
            return next(new AppError('deckId parameter is required', 400));
        }

        // Fetch the deck and ensure it belongs to the user
        const deck = await getDeckByIdService(deckId);
        if (!deck) {
            return next(new AppError('Deck not found', 404));
        }

        // Set brand kit
        const brandKit = deck?.brandKit || {};

        // Get all completed slides for the deck
        const deckSlides = await getSlidesByDeckIdService(deckId);
        if (deckSlides.length === 0) {
            return next(new AppError('No slides found for this deck', 404));
        }

        const completedSlides = deckSlides.filter(slide => slide.progress === 100 && slide.status === 'ready');

        const currentStatus = deck.activityStatus;
        return res.status(200).json({
            status: 'success',
            message: 'Deck progress fetched successfully',
            data: {
                deckId: deck._id,
                status: deck.status,
                brandKit: brandKit,
                activityStatus: currentStatus || 'In Queue',
                progress: deck.progress || 0,
                totalSlides: deck.slideCount || deckSlides.length,
                completedSlides: completedSlides.length,
                slides: completedSlides.map(slide => slide.toObject()),
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        next(new AppError(error.message, 500));
    }
};


// Correct a specific slide controller
const correctSlideController = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return next(new AppError('User not authenticated', 401));
        }

        const { slideId } = req.params;
        if (!slideId) {
            return next(new AppError('slideId parameter is required', 400));
        }

        const { correction } = req.body;
        if (!correction || typeof correction !== 'string' || correction.trim().length === 0) {
            return next(new AppError('Correction text is required', 400));
        }

        const slideData = await getSlideByIdService(slideId);
        if (!slideData) {
            return next(new AppError('Slide not found', 404));
        }

        // Ensure slide belongs to user
        const deck = await getDeckByIdService(slideData.deckId);
        if (!deck) {
            return next(new AppError('Associated deck not found', 404));
        }
        if (deck.ownerId.toString() !== user._id.toString()) {
            return next(new AppError('Unauthorized access to this slide', 403));
        }

        // Create prompt for slide correction
        const prompt = generateCorrectionPrompt(slideData, correction);
        if (!prompt) {
            return next(new AppError('Failed to generate correction prompt', 500));
        }

        // Add slide correction job
        const jobData = {
            slideId,
            prompt,
            userId: user._id
        };

        await addSlideCorrectionJob(jobData);

        return res.status(200).json({
            status: 'success',
            message: 'Slide correction initiated',
            data: {
                slideId,
                status: 'correction_queued'
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Error in correctSlideController:', error);
        next(new AppError(error.message, 500));
    }
};


// Track Slide Correction Progress and return updated slide
const trackSlideCorrectionProgressController = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return next(new AppError('User not authenticated', 401));
        }

        const { slideId } = req.params;
        if (!slideId) {
            return next(new AppError('slideId parameter is required', 400));
        }

        // Fetch the slide and ensure it belongs to the user
        const slide = await getSlideByIdService(slideId);
        if (!slide) {
            return next(new AppError('Slide not found', 404));
        }

        // Ensure slide belongs to user
        const deck = await getDeckByIdService(slide.deckId);
        if (!deck) {
            return next(new AppError('Associated deck not found', 404));
        }
        if (deck.ownerId.toString() !== user._id.toString()) {
            return next(new AppError('Unauthorized access to this slide', 403));
        }

        // Check slide correction status
        const progress = slide.progress || 0;
        const status = slide.status || 'pending';

        if (status === 'ready' && progress === 100) {
            return res.status(200).json({
                status: 'success',
                message: 'Slide correction completed',
                data: {
                    progress,
                    status,
                    slide: slide.toObject(),
                }
            });
        } else if (status === 'failed') {
            return res.status(200).json({
                status: 'failed',
                message: 'Slide correction failed',
                data: {
                    error: slide.error || 'Unknown error during slide correction',
                    slide: slide.toObject(),
                }
            });
        } else {
            return res.status(200).json({
                status: 'in_progress',
                message: 'Slide correction is in progress',
                data: {
                    progress,
                    status,
                    slide: slide.toObject(),
                }
            });
        }
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Error in trackSlideCorrectionProgressController:', error);
        next(new AppError(error.message, 500));
    }
};


// Return all slides for an industry controller
const getIndustrySlidesController = async (req, res, next) => {
    try {
        const { industry } = req.params;
        if (!industry) {
            return next(new AppError('Industry parameter is required', 400));
        }

        const allowedSlides = getAllowedSlides(industry);
        if (!allowedSlides || allowedSlides.length === 0) {
            return next(new AppError('No slides found for the specified industry', 404));
        }

        return res.status(200).json({
            status: 'success',
            message: 'Allowed slides fetched successfully',
            data: {
                industry,
                allowedSlides,
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        next(new AppError(error.message, 500));
    }
};


const getAllIndustriesController = async (req, res, next) => {
    try {
        const industries = [
            'finTech', 'healthTech', 'eduTech', 'ecommerce', 'saas', 'aiML',
            'foodAndBeverage', 'realEstate', 'entertainment', 'travelAndHospitality',
            'cleantech', 'logistics', 'socialImpact', 'gaming', 'hardware',
            'agriTech', 'biotech', 'fashion', 'automotive', 'media', 'telecommunications',
            'agriculture', 'aerospace', 'construction', 'consulting', 'energy',
            'fitness', 'legal', 'manufacturing', 'music', 'nonProfit', 'publishing',
            'retail', 'sports', 'transportation', 'utilities'
        ];
        return res.status(200).json({
            status: 'success',
            message: 'Industries fetched successfully',
            data: { industries }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        next(new AppError(error.message, 500));
    }
};


// Export pitch deck files controller
const exportPitchDeckFilesController = async (req, res, next) => {
    try {
        const { deckId } = req.params;
        if (!deckId) {
            return next(new AppError('deckId parameter is required', 400));
        }

        const { formats } = req.body;
        if (!formats || (formats.pdf !== true && formats.pptx !== true)) {
            return next(new AppError('At least one format (PDF or PPTX) must be specified for export', 400));
        }

        const user = req.user;
        if (!user) {
            return next(new AppError('User not authenticated', 401));
        }

        // Get deck and verify ownership
        const deck = await getDeckByIdService(deckId);
        if (!deck) {
            return next(new AppError('Deck not found', 404));
        }
        if (deck.ownerId.toString() !== user._id.toString()) {
            return next(new AppError('Unauthorized access to this deck', 403));
        }

        // Check if deck has been exported already and has not been modified since last export
        if (deck.status === 'finalized' && deck.exportedAt && deck.updatedAt <= deck.exportedAt) {
            return res.status(200).json({
                status: 'success',
                message: 'Deck has already been exported, no changes detected since last export',
                data: {
                    deck: deck.toObject()
                }
            });
        }

        // Extract old file url to delete after new export
        const oldKeys = [];
        if (formats.pdf && deck.pdfKey) oldKeys.push(deck.pdfKey);
        if (formats.pptx && deck.pptxKey) oldKeys.push(deck.pptxKey);

        // Add export job to the queue
        const jobData = {
            deckId,
            startupName: deck.startupName,
            formats,
            oldKeys,
            userId: user._id
        }
        await addExportJob(jobData);

        return res.status(200).json({
            status: 'success',
            message: 'Deck export initiated',
            data: {
                deckId,
                status: 'Export in queue'
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Error in exportPitchDeckFilesController:', error);
        next(new AppError(error.message, 500));
    }
};


// Get pitch deck file controller
const getPitchDeckFileController = async (req, res, next) => {
    try {
        const { deckId } = req.params;
        if (!deckId) {
            return next(new AppError('deckId parameter is required', 400));
        }

        const user = req.user;
        if (!user) {
            return next(new AppError('User not authenticated', 401));
        }

        // Get deck and verify ownership
        const deck = await getDeckByIdService(deckId);
        if (!deck) {
            return next(new AppError('Deck not found', 404));
        }
        if (deck.ownerId.toString() !== user._id.toString()) {
            return next(new AppError('Unauthorized access to this deck', 403));
        }

        // Return message based on export status
        let message = '';
        if (deck.status === 'exporting') {
            message = 'Deck export is in progress, please check back later';
        } else if (deck.status === 'ready') {
            message = 'Deck is ready for review, export can be initiated';
        } else if (deck.status === 'finalized') {
            message = 'Deck export completed, you can download the files';
        } else if (deck.status === 'failed') {
            message = `Deck export failed: ${deck.activityStatus || 'Unknown error during export'}`;
        } else {
            message = 'Deck is not ready for export yet';
        }

        return res.status(200).json({
            status: 'success',
            message,
            data: {
                status: deck.status,
                deck: deck.toObject()
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Error in getPitchDeckFileController:', error);
        next(new AppError(error.message, 500));
    }
};


// Grt user's pitch decks controller
const getUserPitchDecksController = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return next(new AppError('User not authenticated', 401));
        }

        const decks = await getUserDecksService(user._id);

        return res.status(200).json({
            status: 'success',
            message: 'User decks fetched successfully',
            data: {
                totalDecks: decks.length,
                decks: decks.map(deck => deck.toObject()),
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Error in getUserPitchDecksController:', error);
        next(new AppError(error.message, 500));
    }
};


const deletePitchDeckController = async (req, res, next) => {
    try {
        const { deckId } = req.params;
        if (!deckId) {
            return next(new AppError('deckId parameter is required', 400));
        }

        const user = req.user;
        if (!user) {
            return next(new AppError('User not authenticated', 401));
        }

        // Get deck and verify ownership
        const deck = await getDeckByIdService(deckId);
        if (!deck) {
            return next(new AppError('Deck not found', 404));
        }
        if (deck.ownerId.toString() !== user._id.toString()) {
            return next(new AppError('Unauthorized access to this deck', 403));
        }

        // Get all deck slides
        const slides = await getSlidesByDeckIdService(deckId);
        // Delete all slides and their associated files
        for (const slide of slides) {
            // Delete all slide images if any
            if (slide.images && Array.isArray(slide.images)) {
                for (const img of slide.images) {
                    if (img.key && img.source !== 'default') {
                        await deleteFileService(img.key);
                    }
                }
            }
            // Delete slide entry
            await deleteSlideByIdService(slide._id);
        }
        // Delete deck files if any
        if (deck.pdfKey) {
            await deleteFileService(deck.pdfKey);
        }
        if (deck.pptxKey) {
            await deleteFileService(deck.pptxKey);
        }
        // Delete deck entry
        await deleteDeckByIdService(deckId);

        return res.status(200).json({
            status: 'success',
            message: `${deck.title} Deck and associated slides deleted successfully`,
        });

    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Error in deletePitchDeckController:', error);
        next(new AppError(error.message, 500));
    }
}

// Export the controller
module.exports = {
    createPitchDeckController,
    getPitchDeckProgressController,
    correctSlideController,
    getIndustrySlidesController,
    getAllIndustriesController,
    trackSlideCorrectionProgressController,
    exportPitchDeckFilesController,
    getPitchDeckFileController,
    getUserPitchDecksController,
    deletePitchDeckController,
};