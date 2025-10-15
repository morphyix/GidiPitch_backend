const { Worker } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');
const { generateSlideContent, generateSlideImage } = require('../../services/getAIDeckContentService');
const { updateDeckByIdService } = require('../../services/deckService');
const { updateSlideByIdService, getSlidesByDeckIdService, updateSlideImageService } = require('../../services/slideService');


// Create a worker to process pitch deck generation jobs
const pitchDeckWorker = new Worker('pitchDeckQueue', async (job) => {
    try {
        console.log("Processing pitch deck job:", job.id);
        const { deckId, prompts, startupData, deckSlides, imageGenType } = job.data;
        if (!deckId || !prompts || !startupData || !deckSlides || !imageGenType) {
            throw new AppError('Invalid job data for pitch deck generation', 400);
        }

        // Update deck status to 'generating' and progress to 10%
        await updateDeckByIdService(deckId, { status: 'generating', progress: 10 });

        // Generate slide content for each slide in the prompt object
        for (const key of Object.keys(prompts)) {
            const slidePrompt = prompts[key];
            console.log(`Generating content for slide: ${key}`);

            const slideId = deckSlides[key];
            if (!slideId) {
                console.warn(`No slide ID found for slide type: ${key}. Skipping...`);
                continue;
            }

            // Generate slide content using AI service
            // update slide status to 'generating'
            await updateDeckByIdService(deckId, { activityStatus: `Generating content for slide: ${key}` });
            await updateSlideByIdService(slideId, { status: 'generating', progress: 20 });
            console.log(`Slide status updated to 'generating' for slide: ${key}`);

            const slideContent = await generateSlideContent(slidePrompt);
            console.log(`Slide content generated for slide: ${key}`);
            // Update slide entry with generated content
            slideContent.status = imageGenType === 'ai' ? 'image_gen' : 'ready';
            slideContent.progress = imageGenType === 'ai' ? 50 : 100; // if AI image generation, set progress to 50%, else 100%
            await updateSlideByIdService(slideId, slideContent);
            await updateDeckByIdService(deckId, { activityStatus: `Slide content generated for slide: ${key}` });
            console.log(`Slide content saved to DB for slide: ${key}`);

            console.log(slideContent);

            // Update deck progress using average progress of all slides
            const updatedSlides = await getSlidesByDeckIdService(deckId);
            const updatedTotalProgress = updatedSlides.reduce((sum, slide) => sum + (slide.progress || 0), 0);
            const updatedAverageProgress = Math.floor(updatedTotalProgress / updatedSlides.length);
            await updateDeckByIdService(deckId, { progress: updatedAverageProgress });
            console.log(`Deck progress updated to ${updatedAverageProgress}% after generating content for slide: ${key}`);

            // Generate Slide image
            if (imageGenType === 'ai' && slideContent.images.length > 0) {
                console.log(`Generating images for slide: ${key}`);
                for (let i = 0; i < slideContent.images.length; i++) {
                    const image = slideContent.images[i];
                    console.log(`Generating image ${i + 1} for slide: ${key}`);
                    await updateDeckByIdService(deckId, { activityStatus: `Generating image ${i + 1} for slide: ${key}` });
                    try {
                        const imgObj = await generateSlideImage(image.prompt, { caption: image.caption });
                        console.log(`Image generated for slide: ${key}, image ${i + 1}`);
                        // update slide image entry with generated image key and status
                        await updateSlideImageService(slideId, i, {
                            key: imgObj.key,
                            status: 'completed'
                        });
                        // increment slide progress by equal parts based on number of images
                        const imageProgressIncrement = Math.floor(50 / slideContent.images.length);
                        await updateSlideByIdService(slideId, { $inc: { progress: imageProgressIncrement } });
                        console.log(`Image key saved to DB for slide: ${key}, image ${i + 1}`);
                        await updateDeckByIdService(deckId, { activityStatus: `Image ${i + 1} generated for slide: ${key}` });
                    } catch (imgError) {
                        console.error(`Error generating image for slide: ${key}, image ${i + 1}:`, imgError);
                        // update slide image entry with error message and status
                        await updateSlideImageService(slideId, i, {
                            status: 'failed',
                            error: imgError.message
                        });
                        await updateDeckByIdService(deckId, { activityStatus: `Error generating image ${i + 1} for slide: ${key}` });
                    }
                }
            }
        }
        // After all slide contents are generated
        console.log("All slide contents generated.");
        await updateDeckByIdService(deckId, { status: 'ready', activityStatus: 'All slide contents generated, ready for review' });
        console.log("Deck status updated to 'ready'.");
    } catch (error) {
        console.error('Error processing pitch deck job:', error);
        if (job.data && job.data.deckId) {
            await updateDeckByIdService(job.data.deckId, { status: 'failed', error: error.message });
        }
        throw error; // Re-throw the error to mark the job as failed
    }
}, { connection: redisClient });

// listen for worker errors
pitchDeckWorker.on('failed', async (job, err) => {
    console.error(`Pitch deck job failed: ${job.id}, Error: ${err.message}`);
    if (job.data && job.data.deckId) {
        await updateDeckByIdService(job.data.deckId, { status: 'failed', error: err.message });
    }
});

// export the worker
module.exports = {
    pitchDeckWorker
};