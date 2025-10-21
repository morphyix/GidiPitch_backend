const { Worker } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');
const { updateSlideByIdService, updateSlideImageService, getSlideByIdService } = require('../../services/slideService');
const { generateSlideContent, generateSlideImage } = require('../../services/getAIDeckContentService');

const slideCorrectionWorker = new Worker(
  'slideCorrectionQueue',
  async (job) => {
    const { slideId, prompt } = job.data;
    try {
      console.log(`Processing slide correction job: ${job.id}`);

      if (!slideId || !prompt) throw new AppError('Invalid job data for slide correction', 400);

      await updateSlideByIdService(slideId, { status: 'generating', progress: 10 });

      const slideContent = await generateSlideContent(prompt);
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
            const imgObj = await generateSlideImage(image.prompt, { caption: image.caption });
            await updateSlideImageService(slideId, i, { key: imgObj.key, status: 'completed' });
          } catch (err) {
            console.error(`Error generating image ${i + 1}:`, err);
            await updateSlideImageService(slideId, i, { status: 'failed', error: err.message });
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

      console.log(`Slide correction completed for slide: ${slideId}`);
    } catch (error) {
      console.error(`Error processing slide correction job for ${slideId}:`, error);
      if (slideId)
        await updateSlideByIdService(slideId, { status: 'failed', error: error.message });
      throw new AppError(error.message || 'Failed to process slide correction job', 500);
    }
  },
  { connection: redisClient }
);

module.exports = { slideCorrectionWorker };
