const { Worker } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');
const { updateSlideByIdService, updateSlideImageService, getSlideByIdService } = require('../../services/slideService');
const { generateSlideContent, generateSlideImage } = require('../../services/getAIDeckContentService');
const { updateDeckByIdService } = require('../../services/deckService');
const { modifyUserTokensService } = require('../../services/authService');

const slideCorrectionWorker = new Worker(
  'slideCorrectionQueue',
  async (job) => {
    const { slideId, prompt, userId } = job.data;
    let textTx;
    let imageTx;
    try {
      console.log(`Processing slide correction job: ${job.id}`);

      if (!slideId || !prompt) throw new AppError('Invalid job data for slide correction', 400);

      // Get deckId for activity status update
      const slide = await getSlideByIdService(slideId);
      if (!slide) throw new AppError('Slide not found for slide correction', 404);
      const deckId = slide.deckId;

      // Update deck activity status
      await updateDeckByIdService(deckId, { activityStatus: `Correcting slide: ${slide.slideType}`, status: 'editing' });

      await updateSlideByIdService(slideId, { status: 'generating', progress: 50 });
      textTx = await modifyUserTokensService(userId, 'deduct', 4, `Generating text content for slide ${slideId}`, `${job.id}-text`); // Deduct 4 tokens for slide correction


      const slideContent = await generateSlideContent(prompt);
      console.log(`Generated corrected content for slide ${slideId}:`, slideContent);
      slideContent.status = slideContent.generateImage ? 'image_gen' : 'ready';
      slideContent.progress = slideContent.generateImage ? 50 : 100;
      await updateSlideByIdService(slideId, slideContent);

      // Image generation
      if (slideContent.generateImage && Array.isArray(slideContent.images) && slideContent.images.length > 0) {
        let currentProgress = 50;
        const increment = Math.floor(50 / slideContent.images.length);

        for (let i = 0; i < slideContent.images.length; i++) {
          const image = slideContent.images[i];
          try {
            imageTx = await modifyUserTokensService(userId, 'deduct', 6, `Generating image for slide ${slideId}`, `${job.id}-image-${i + 1}`); // Deduct 6 tokens per image generation
            const imgObj = await generateSlideImage(image.prompt, { caption: image.caption });
            await updateSlideImageService(slideId, image.caption, { key: imgObj.key, status: 'completed' });
          } catch (err) {
            console.error(`Error generating image ${i + 1}:`, err);
            await updateSlideImageService(slideId, image.caption, { status: 'failed', error: err.message });
            if (imageTx?.jobId) {
              await modifyUserTokensService(userId, 'refund', 6, `Refund for failed image generation in slide correction ${slide.slideType}`, imageTx.jobId); // Refund 6 tokens for failed image generation
            }
          }

          currentProgress = Math.min(currentProgress + increment, 100);
          await updateSlideByIdService(slideId, { progress: currentProgress });
        }

        const slide = await getSlideByIdService(slideId);
        const hasFailed = slide.images?.some(img => img.status === 'failed');
        await updateSlideByIdService(slideId, {
          status: hasFailed ? 'partial_failed' : 'ready',
          progress: 100
        });
      }

      // Update deck activity status to ready
      await updateDeckByIdService(deckId, { activityStatus: `Slide correction completed for slide: ${slide.slideType}`, status: 'ready' });

      console.log(`Slide correction completed for slide: ${slideId}`);
    } catch (error) {
      console.error(`Error processing slide correction job for ${slideId}:`, error);
      if (slideId)
        await updateSlideByIdService(slideId, { status: 'failed', error: error.message });
      // Refund tokens for failed slide correction
      if (textTx?.jobId) {
        await modifyUserTokensService(userId, 'refund', 4, `Refund for failed slide correction for slide ${slideId}`, textTx.jobId); // Refund 4 tokens for failed slide correction
      }
      throw new AppError(error.message || 'Failed to process slide correction job', 500);
    }
  },
  { connection: redisClient, concurrency: 3 }
);

module.exports = { slideCorrectionWorker };
