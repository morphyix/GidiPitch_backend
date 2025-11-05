const { Worker } = require('bullmq');
const pLimit = require('p-limit');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');
const {
  generateSlideContent,
  generateSlideImage,
  generateBrandKit,
} = require('../../services/getAIDeckContentService');
const {
  updateDeckByIdService,
} = require('../../services/deckService');
const {
  updateSlideByIdService,
  getSlidesByDeckIdService,
  updateSlideImageService,
} = require('../../services/slideService');
const { extractFileKey } = require('../../utils/helper');
const { modifyUserTokensService } = require('../../services/authService');

// Default images
const DEFAULT_IMAGES = {
  default: extractFileKey('https://files.thebigphotocontest.com/gidiPitch/1762068679238-cover.png'),
  problem: extractFileKey('https://files.thebigphotocontest.com/gidiPitch/1762057087566-problem.png'),
  solution: extractFileKey('https://files.thebigphotocontest.com/gidiPitch/1762057643136-solution.png'),
  market: extractFileKey('https://files.thebigphotocontest.com/gidiPitch/1762068512348-market.png'),
  businessModel: extractFileKey('https://files.thebigphotocontest.com/gidiPitch/1762057891739-businessModel.png'),
  competition: extractFileKey('https://files.thebigphotocontest.com/gidiPitch/1762068600596-competition.png'),
  goMarket: extractFileKey('https://files.thebigphotocontest.com/gidiPitch/1762068531695-goToMarket.png'),
  product: extractFileKey('https://files.thebigphotocontest.com/gidiPitch/1762068373700-product.png'),
  team: extractFileKey('https://files.thebigphotocontest.com/gidiPitch/profile.png'),
};

// Limit concurrency to 4 slides at once
const limit = pLimit(4);

// --- Helper function to calculate and update overall deck progress ---
async function updateDeckProgress(deckId) {
  const slides = await getSlidesByDeckIdService(deckId);
  if (!slides || slides.length === 0) return 0;

  const totalProgress = slides.reduce((sum, s) => sum + (s.progress || 0), 0);
  const averageProgress = Math.floor(totalProgress / slides.length);

  await updateDeckByIdService(deckId, { progress: averageProgress });
  return averageProgress;
}

// --- Process individual slide ---
async function processSlide({
  key,
  slidePrompt,
  slideId,
  deckId,
  imageGenType,
  userId,
  jobId
}) {
    let textTx;
    let imageTx;
  try {
    await updateDeckByIdService(deckId, { activityStatus: `Generating content for ${key}` });
    await updateSlideByIdService(slideId, { status: 'generating', progress: 20 });
    textTx = await modifyUserTokensService(userId, 'deduct', 4, `Generating text content for slide ${key}`, `${jobId}-text`); // Deduct 4 tokens per slide generation

    const slideContent = await generateSlideContent(slidePrompt, { model: 'gemini-2.5-pro'});
    slideContent.status = imageGenType === 'ai' ? 'image_gen' : 'ready';
    slideContent.progress = imageGenType === 'ai' ? 50 : 100;

    await updateSlideByIdService(slideId, slideContent);
    await updateDeckProgress(deckId);

    // Generate images (parallel inside a single slide) except team slide
    if (key === 'team') {
        const teamDefaultKey = DEFAULT_IMAGES.team || DEFAULT_IMAGES.default;
        await Promise.all(
            (slideContent.images || []).map((img) =>
            updateSlideImageService(slideId, img.caption, {
                key: `gidiPitch/${teamDefaultKey}`,
                status: 'completed',
                source: 'default',
            }),
            ),
        );
        await updateSlideByIdService(slideId, { progress: 100, status: 'ready' });
        await updateDeckProgress(deckId);
    } else if (imageGenType === 'ai' && slideContent.images?.length > 0) {
      const imageProgressIncrement = Math.floor(50 / slideContent.images.length);

      await Promise.allSettled(
        slideContent.images.map(async (image, i) => {
          try {
            imageTx = await modifyUserTokensService(userId, 'deduct', 6, `Generating image for slide ${key}`, `${jobId}-image-${i + 1}`); // Deduct 6 tokens per image generation

            const imgObj = await generateSlideImage(image.prompt, { caption: image.caption });
            await updateSlideImageService(slideId, image.caption, {
              key: imgObj.key,
              status: 'completed',
            });

            // Increment slide progress gradually
            const slide = await updateSlideByIdService(slideId, { $inc: { progress: imageProgressIncrement } });
            await updateDeckProgress(deckId);
          } catch (err) {
            await updateSlideImageService(slideId, image.caption, {
              status: 'failed',
              error: err.message,
            });
            // Refund tokens for failed image generation
            if (imageTx?.jobId) {
                await modifyUserTokensService(userId, 'refund', 6, `Refund for failed image generation on slide ${key}`, imageTx.jobId); // Refund 6 tokens for failed image generation
            }
            console.error(`Error generating image for slide ${key}:`, err);
          }
        }),
      );

      await updateSlideByIdService(slideId, { progress: 100, status: 'ready' });
      await updateDeckProgress(deckId);
    } else {
      // Use default images
      const defaultKey = DEFAULT_IMAGES[key] || DEFAULT_IMAGES.default;
      await Promise.all(
        (slideContent.images || []).map((img) =>
          updateSlideImageService(slideId, img.caption, {
            key: `gidiPitch/${defaultKey}`,
            status: 'completed',
            source: 'default',
          }),
        ),
      );
      await updateSlideByIdService(slideId, { progress: 100, status: 'ready' });
      await updateDeckProgress(deckId);
    }

    return { key, success: true };
  } catch (err) {
    console.error(`Slide ${key} failed:`, err);
    await updateSlideByIdService(slideId, { status: 'failed', error: err.message });
    // Refund tokens for failed slide generation
    if (textTx?.jobId) {
        await modifyUserTokensService(userId, 'refund', 4, `Refund for failed slide ${key} text content generation`, textTx.jobId); // Refund 4 tokens for failed slide generation
    }
    await updateDeckProgress(deckId);
    return { key, success: false, error: err.message };
  }
}

// --- Worker definition ---
const pitchDeckWorker = new Worker(
  'pitchDeckQueue',
  async (job) => {
    let brandTx;
    const { deckId, prompts, startupData, deckSlides, imageGenType, tailwindPrompt, userId } = job.data;

    if (!deckId || !prompts || !deckSlides || !userId) {
      throw new AppError('Invalid job data for pitch deck generation', 400);
    }

    console.log(`Processing pitch deck job ${job.id} for deck ${deckId}`);

    // Deduct token for brandKit
    brandTx = await modifyUserTokensService(userId, 'deduct', 3, `Generating brand kit for deck ${deckId}`, `${job.id}-brandkit`); // Deduct 3 tokens for brand kit generation
    job.data.brandTx = brandTx

    // Step 1: Generate brand kit once
    const brandKit = await generateBrandKit(tailwindPrompt);
    const brandKitObj = {
      background: brandKit.background || 'bg-amber-950',
      title: brandKit.title || 'text-yellow-400',
      bullets: brandKit.bullets || 'text-gray-200',
      note: brandKit.notes || 'text-gray-500',
    };

    await updateDeckByIdService(deckId, {
      status: 'generating',
      progress: 10,
      brandKit: brandKitObj,
      activityStatus: 'Brand kit generated, generating slides...',
    });

    // Step 2: Generate slides with throttling
    const slideKeys = Object.keys(prompts);
    const results = await Promise.allSettled(
      slideKeys.map((key) =>
        limit(() =>
          processSlide({
            key,
            slidePrompt: prompts[key],
            slideId: deckSlides[key],
            deckId,
            imageGenType,
            userId,
            jobId: job.id,
          }),
        ),
      ),
    );

    // Step 3: Wrap up
    const completed = results.filter((r) => r.value?.success).length;
    const total = slideKeys.length;
    const finalProgress = await updateDeckProgress(deckId);

    await updateDeckByIdService(deckId, {
      status: completed === total ? 'ready' : 'generating',
      activityStatus:
        completed === total
          ? 'All slides generated successfully.'
          : `${completed}/${total} slides generated.`,
      progress: finalProgress,
    });

    console.log(`Deck ${deckId} completed with progress ${finalProgress}%`);
  },
  { connection: redisClient, concurrency: 2 },
);

// Handle job failure
pitchDeckWorker.on('failed', async (job, err) => {
  console.error(`Pitch deck job failed: ${job.id}, Error: ${err.message}`);
  if (job.data?.deckId) {
    await updateDeckByIdService(job.data.deckId, { status: 'failed', error: err.message });
    // Refund brandKit
    if (job.data?.brandTx?.jobId) {
        await modifyUserTokensService(job.data.userId, 'refund', 3, `Refund for failed brand kit generation for deck ${job.data.deckId}`, job.data.brandTx.jobId); // Refund 3 tokens for failed brand kit generation
    }
  }
});

module.exports = { pitchDeckWorker };
