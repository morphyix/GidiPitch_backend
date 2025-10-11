const { createDeckService, updateDeckByIdService, getDeckByIdService } = require('../services/deckService');
const { createSlideService, getSlidesByDeckIdService } = require('../services/slideService');
const { addPitchDeckJob } = require('../jobs/pitchDeckGenerator/queue');
const { generatePromptsForSlides, getAllowedSlides } = require('../utils/generatePitchPrompts');
const { AppError } = require('../utils/error');
const { sanitize } = require('../utils/helper');


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
            competitions, businessModel, milestones, financials, ask, team, moreInfo, features } = body;
        
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
                asset: member.asset ? sanitize(member.asset) : '',
                linkedIn: member.linkedIn ? sanitize(member.linkedIn) : '',
            })),
            imageGenType: sanitize(imageGenType),
            brandColor: brandColor ? sanitize(brandColor) : '',
            brandStyle: brandStyle ? sanitize(brandStyle) : '',
        };

        if (milestones) {
            startupData.milestones = sanitize(milestones);
        }
        if (financials) {
            startupData.financials = sanitize(financials);
        }
        if (ask) {
            startupData.ask = sanitize(ask);
        }
        // Generate prompts for each slide
        const prompts = generatePromptsForSlides(startupData, body.slides);
        if (!prompts || Object.keys(prompts).length === 0) {
            return next(new AppError('Failed to generate prompts for the selected slides', 500));
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
            imageGenType
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
        const userId = req.user._id;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const { deckId } = req.params;
        if (!deckId) {
            return next(new AppError('deckId parameter is required', 400));
        }

        // Fetch the deck and ensure it belongs to the user
        const deck = await getDeckByIdService(deckId);
        if (!deck) {
            return next(new AppError('Deck not found', 404));
        }
        if (deck.ownerId.toString() !== userId.toString()) {
            return next(new AppError('Unauthorized access to this deck', 403));
        }

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


// Export the controller
module.exports = {
    createPitchDeckController,
    getPitchDeckProgressController,
};