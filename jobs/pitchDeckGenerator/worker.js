const { Worker } = require('bullmq');
const pLimit = require('p-limit');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');
const {
  generateSlideContent,
  generateSlideImage,
  generateRunwareImage,
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
const { generatePremiumStyledIcon } = require('../../utils/iconPipeline');
const { modifyUserTokensService } = require('../../services/authService');
const { logFailedDeckJobService } = require('../../services/failedDeckJobService');

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
const limit = pLimit(2);

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
  brandColor,
  jobId,
  trackingData, // ✅ NEW: Pass tracking object by reference
}) {
  let textTx;
  let imageTxList = []; // Track all image transactions
  
  try {
    await updateDeckByIdService(deckId, { activityStatus: `Generating content for ${key}` });
    await updateSlideByIdService(slideId, { status: 'generating', progress: 20 });
    
    textTx = await modifyUserTokensService(userId, 'deduct', 7, `Generating text content for slide ${key}`, `${jobId}-text-${key}`);
    
    // ✅ Track this transaction
    trackingData.transactions.push({
      type: 'text',
      slideKey: key,
      jobId: textTx.jobId,
      amount: 4,
    });

    const slideContent = await generateSlideContent(slidePrompt, { model: 'gemini-2.5-pro' });
    slideContent.status = imageGenType === 'ai' ? 'image_gen' : 'ready';
    slideContent.progress = imageGenType === 'ai' ? 50 : 100;

    await updateSlideByIdService(slideId, slideContent);
    await updateDeckProgress(deckId);

    // Generate images
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

      // ✅ Use Promise.all instead of allSettled - let failures propagate
      await Promise.all(
        slideContent.images.map(async (image, i) => {
          let imageTx;
          let amount;
          if (key === 'competitions') {
            imageTx = await modifyUserTokensService(
              userId,
              'deduct',
              10,
              `Generating image for slide ${key}`,
              `${jobId}-image-${key}-${i + 1}`,
            );
            amount = 10;
          } else if (key === 'cover') {
            imageTx = await modifyUserTokensService(
              userId,
              'deduct',
              3,
              `Generating image for slide ${key}`,
              `${jobId}-image-${key}-${i + 1}`,
            );
            amount = 3;
          } else {
            imageTx = await modifyUserTokensService(
              userId,
              'deduct',
              1,
              `Generating icon for slide ${key}`,
              `${jobId}-image-${key}-${i + 1}`,
            );
            amount = 1;
          }
          
          // ✅ Track this transaction
          imageTxList.push({
            type: 'image',
            slideKey: key,
            jobId: imageTx.jobId,
            amount: amount,
            imageIndex: i,
          });
          
          trackingData.transactions.push({
            type: 'image',
            slideKey: key,
            jobId: imageTx.jobId,
            amount: amount,
            imageIndex: i,
          });
          let imgObj;
          if (key === 'competitions' || key === 'competition') {
            imgObj = await generateRunwareImage(image.prompt, { model: 'google:4@2' });
          } else if (key === 'cover') {
            imgObj = await generateRunwareImage(image.prompt);
          } else {
            imgObj = await generatePremiumStyledIcon(image.prompt, brandColor);
          }
          await updateSlideImageService(slideId, image.caption, {
            key: imgObj.key,
            status: 'completed',
          });

          await updateSlideByIdService(slideId, { $inc: { progress: imageProgressIncrement } });
          await updateDeckProgress(deckId);
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
    
    // ✅ Mark slide as failed
    await updateSlideByIdService(slideId, { status: 'failed', error: err.message });
    
    // ✅ Refund text transaction if it succeeded
    if (textTx?.jobId) {
      try {
        await modifyUserTokensService(
          userId,
          'refund',
          7,
          `Refund for failed slide ${key} text content generation`,
          textTx.jobId,
        );
      } catch (refundErr) {
        console.error(`Failed to refund text tokens for slide ${key}:`, refundErr);
      }
    }
    
    // ✅ Refund any successful image transactions
    for (const imgTx of imageTxList) {
      try {
        const amt = imgTx.amount || 1;
        await modifyUserTokensService(
          userId,
          'refund',
          amt,
          `Refund for failed image generation on slide ${key}`,
          imgTx.jobId,
        );
      } catch (refundErr) {
        console.error(`Failed to refund image tokens for slide ${key}:`, refundErr);
      }
    }
    
    await updateDeckProgress(deckId);
    
    // ✅ IMPORTANT: Re-throw to make job fail
    throw new AppError(`Failed to process slide ${key}: ${err.message}`, 500);
  }
}

// --- Worker definition ---
const pitchDeckWorker = new Worker(
  'pitchDeckQueue',
  async (job) => {
    const { deckId, prompts, startupData, deckSlides, imageGenType, tailwindPrompt, userId } = job.data;

    if (!deckId || !prompts || !deckSlides || !userId) {
      throw new AppError('Invalid job data for pitch deck generation', 400);
    }

    console.log(`Processing pitch deck job ${job.id} for deck ${deckId}`);

    // ✅ Track all transactions for this job
    const trackingData = {
      brandTx: null,
      transactions: [],
    };

    try {
      // Step 1: Generate brand kit once
      const brandTx = await modifyUserTokensService(
        userId,
        'deduct',
        5,
        `Generating brand kit for deck ${deckId}`,
        `${job.id}-brandkit`,
      );
      
      // ✅ Store in tracking object
      trackingData.brandTx = brandTx;
      
      // ✅ Store in job data for failed handler access
      await job.updateData({ ...job.data, brandTx, trackingData });

      const brandKit = await generateBrandKit(tailwindPrompt, { model: 'gemini-2.5-pro' });
      const brandKitObj = {
        background: brandKit?.default?.background || 'bg-amber-950',
        title: brandKit?.default?.title || 'text-yellow-400',
        bullets: brandKit?.default?.bullets || 'text-gray-200',
        note: brandKit?.default?.notes || 'text-gray-500',
        iconSlide: {
          background: brandKit?.iconSlide?.background || 'bg-amber-950',
          title: brandKit?.iconSlide?.title || 'text-yellow-400',
          bullets: brandKit?.iconSlide?.bullets || 'text-gray-200',
          note: brandKit?.iconSlide?.notes || 'text-gray-500',
        }
      };

      await updateDeckByIdService(deckId, {
        status: 'generating',
        progress: 10,
        brandKit: brandKitObj,
        activityStatus: 'Brand kit generated, generating slides...',
      });

      // Step 2: Generate slides with throttling
      const slideKeys = Object.keys(prompts);
      
      // ✅ Use Promise.all instead of allSettled - let failures propagate
      const results = await Promise.all(
        slideKeys.map((key) =>
          limit(() =>
            processSlide({
              key,
              slidePrompt: prompts[key],
              slideId: deckSlides[key],
              deckId,
              imageGenType,
              userId,
              brandColor: brandKit?.iconSlide?.title,
              jobId: job.id,
              trackingData, // Pass by reference
            }),
          ),
        ),
      );

      // Step 3: Wrap up
      const completed = results.filter((r) => r?.success).length;
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
      
    } catch (err) {
      // ✅ This will trigger the on('failed') handler
      console.error(`Job ${job.id} failed:`, err);
      throw err;
    }
  },
  { 
    connection: redisClient, 
    concurrency: 2,
    // ✅ Configure retry behavior
    // Don't retry by default - handle retries manually if needed
  },
);

// Handle job failure
pitchDeckWorker.on('failed', async (job, err) => {
  console.error(`Pitch deck job failed: ${job.id}, Error: ${err.message}`);
  
  if (!job?.data?.deckId) {
    console.error('No deckId in failed job data');
    return;
  }

  try {
    // Update deck status
    await updateDeckByIdService(job.data.deckId, { 
      status: 'failed', 
      error: err.message,
      activityStatus: 'Deck generation failed',
    });

    // ✅ Refund brandKit if it was charged
    if (job.data?.brandTx?.jobId) {
      try {
        await modifyUserTokensService(
          job.data.userId,
          'refund',
          5,
          `Refund for failed brand kit generation for deck ${job.data.deckId}`,
          job.data.brandTx.jobId,
        );
        console.log(`Refunded brand kit tokens for job ${job.id}`);
      } catch (refundErr) {
        console.error(`Failed to refund brand kit tokens:`, refundErr);
      }
    }

    // ✅ Log failed deck job
    const deckSlides = await getSlidesByDeckIdService(job.data.deckId);
    const failedSlides = [];
    
    for (const slide of deckSlides) {
      if (slide.status !== 'ready') {
        const slideData = {};
        slideData[slide.slideType] = slide._id;
        failedSlides.push(slideData);
      }
    }
    
    await logFailedDeckJobService(
      job.data.userId,
      job.data.deckId,
      failedSlides,
      err.message,
      job.id,
    );
    
    console.log(`Logged failed deck job for deck ${job.data.deckId}`);
    
  } catch (logErr) {
    console.error(`Error in failed handler for deck ${job.data.deckId}:`, logErr);
  }
});

// ✅ Fixed error handler
pitchDeckWorker.on('error', (err) => {
  console.error(`Worker error:`, err);
});

module.exports = { pitchDeckWorker };