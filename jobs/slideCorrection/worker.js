const { Worker } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');
const { updateSlideByIdService, updateSlideImageService, getSlideByIdService } = require('../../services/slideService');
const { generateSlideContent, generateSlideImage, generateRunwareImage } = require('../../services/getAIDeckContentService');
const { updateDeckByIdService } = require('../../services/deckService');
const { modifyUserTokensService } = require('../../services/authService');
const { logFailedSlideJobService } = require('../../services/failedSlideJobService');
const { generatePremiumStyledIcon } = require('../../utils/iconPipeline');

const slideCorrectionWorker = new Worker(
  'slideCorrectionQueue',
  async (job) => {
    const { slideId, prompt, userId, brandColor } = job.data;
    
    // ✅ Track all transactions
    const transactions = {
      text: null,
      images: [] // Track all successful image token deductions
    };
    
    try {
      console.log(`Processing slide correction job: ${job.id}`);

      if (!slideId || !prompt) {
        throw new AppError('Invalid job data for slide correction', 400);
      }

      // Get deckId for activity status update
      const slide = await getSlideByIdService(slideId);
      if (!slide) {
        throw new AppError('Slide not found for slide correction', 404);
      }
      const deckId = slide.deckId;

      // Update deck activity status
      await updateDeckByIdService(deckId, { 
        activityStatus: `Correcting slide: ${slide.slideType}`, 
        status: 'editing' 
      });

      await updateSlideByIdService(slideId, { 
        status: 'generating', 
        progress: 50 
      });

      // ✅ Deduct tokens for text generation
      const textTx = await modifyUserTokensService(
        userId, 
        'deduct', 
        7, 
        `Generating text content for slide ${slide.slideType}`, 
        `${job.id}-text`
      );
      
      transactions.text = textTx;

      // Generate slide content
      const slideContent = await generateSlideContent(prompt);
      console.log(`Generated corrected content for slide ${slideId}`);
      
      slideContent.status = slideContent.generateImage ? 'image_gen' : 'ready';
      slideContent.progress = slideContent.generateImage ? 50 : 100;
      
      await updateSlideByIdService(slideId, slideContent);

      // ✅ Image generation
      if (slideContent.generateImage && Array.isArray(slideContent.images) && slideContent.images.length > 0) {
        let currentProgress = 50;
        const increment = Math.floor(50 / slideContent.images.length);

        for (let i = 0; i < slideContent.images.length; i++) {
          const image = slideContent.images[i];
          let imageTx = null;
          let amount = 1;
          
          try {
            // Deduct tokens for this image
            if (slide.slideType === 'competitions') {
              amount = 10;
              imageTx = await modifyUserTokensService(
                userId, 
                'deduct', 
                amount, 
                `Generating image ${i + 1} for slide ${slide.slideType}`, 
                `${job.id}-image-${i + 1}`
              );
            } else if (slide.slideType === 'cover') {
              amount = 3;
              imageTx = await modifyUserTokensService(
                userId, 
                'deduct', 
                amount, 
                `Generating image ${i + 1} for slide ${slide.slideType}`, 
                `${job.id}-image-${i + 1}`
              );
            } else {
              amount = 1;
              // Icons for other slides
              imageTx = await modifyUserTokensService(
                userId, 
                'deduct', 
                amount, 
                `Generating icon ${i + 1} for slide ${slide.slideType}`, 
                `${job.id}-image-${i + 1}`
              );
            }
            
            // ✅ Track successful deduction (only if not skipped)
            if (imageTx && !imageTx.skipped) {
              transactions.images.push({
                jobId: imageTx.jobId,
                imageIndex: i,
                caption: image.caption
              });
            }

            // Generate the image
            let imgObj;
            if (slide.slideType === 'competitions') {
              imgObj = await generateRunwareImage(image.prompt, { model: 'google:4@2' });
            } else if (slide.slideType === 'cover') {
              imgObj = await generateRunwareImage(image.prompt);
            } else {
              imgObj = await generatePremiumStyledIcon(image.prompt, brandColor);
            }
            
            await updateSlideImageService(slideId, image.caption, { 
              key: imgObj.key, 
              status: 'completed' 
            });
            
            console.log(`✓ Image ${i + 1}/${slideContent.images.length} generated successfully`);
            
          } catch (err) {
            console.error(`✗ Error generating image ${i + 1}/${slideContent.images.length}:`, err);
            
            // Mark image as failed
            await updateSlideImageService(slideId, image.caption, { 
              status: 'failed', 
              error: err.message 
            });
            
            // ✅ Refund immediately for this specific failed image
            if (imageTx?.jobId && !imageTx.skipped) {
              try {
                await modifyUserTokensService(
                  userId, 
                  'refund', 
                  amount, 
                  `Refund for failed image ${i + 1} in slide correction`, 
                  imageTx.jobId
                );
                console.log(`Refunded ${amount} tokens for failed image ${i + 1}`);
                
                // ✅ Remove from tracking since we already refunded
                transactions.images = transactions.images.filter(
                  tx => tx.jobId !== imageTx.jobId
                );
              } catch (refundErr) {
                console.error(`Failed to refund tokens for image ${i + 1}:`, refundErr);
              }
            }
          }

          // Update progress
          currentProgress = Math.min(currentProgress + increment, 100);
          await updateSlideByIdService(slideId, { progress: currentProgress });
        }

        // Check final status
        const updatedSlide = await getSlideByIdService(slideId);
        const hasFailed = updatedSlide.images?.some(img => img.status === 'failed');
        
        await updateSlideByIdService(slideId, {
          status: hasFailed ? 'partial_failed' : 'ready',
          progress: 100
        });
      }

      // Update deck activity status to ready
      await updateDeckByIdService(deckId, { 
        activityStatus: `Slide correction completed for slide: ${slide.slideType}`, 
        status: 'ready'
      });

      console.log(`✓ Slide correction completed for slide: ${slideId}`);
      
      return {
        success: true,
        slideId,
        imagesGenerated: transactions.images.length
      };
      
    } catch (error) {
      console.error(`✗ Error processing slide correction job for ${slideId}:`, error);
      
      // Update slide status
      if (slideId) {
        try {
          await updateSlideByIdService(slideId, { 
            status: 'failed', 
            error: error.message 
          });
        } catch (updateErr) {
          console.error('Failed to update slide status:', updateErr);
        }
      }

      // ✅ Refund ALL tokens because job failed
      console.log('Job failed - refunding all deducted tokens...');
      
      // Refund text tokens
      if (transactions.text?.jobId && !transactions.text.skipped) {
        try {
          await modifyUserTokensService(
            userId, 
            'refund', 
            7, 
            `Refund for failed slide correction`, 
            transactions.text.jobId
          );
          console.log('✓ Refunded 4 tokens for text generation');
        } catch (refundErr) {
          console.error('✗ Failed to refund text tokens:', refundErr);
        }
      }

      // ✅ Refund ALL successful image tokens (in batch if possible, or one by one)
      if (transactions.images.length > 0) {
        console.log(`Refunding tokens for ${transactions.images.length} successfully generated images...`);
        
        for (const imgTx of transactions.images) {
          try {
            await modifyUserTokensService(
              userId, 
              'refund', 
              1, 
              `Refund for image ${imgTx.imageIndex + 1} in failed job`, 
              imgTx.jobId
            );
            console.log(`✓ Refunded 1 tokens for image ${imgTx.imageIndex + 1}`);
          } catch (refundErr) {
            console.error(`✗ Failed to refund tokens for image ${imgTx.imageIndex + 1}:`, refundErr);
          }
        }
        
        console.log(`✓ Refund complete: ${transactions.images.length * 6} tokens refunded for images`);
      }

      throw new AppError(
        error.message || 'Failed to process slide correction job', 
        500
      );
    }
  },
  { connection: redisClient, concurrency: 2 }
);

slideCorrectionWorker.on('failed', async (job, err) => {
  try {
    console.error(`Slide correction job failed for job ID ${job.id}:`, err);
    const { slideId, userId, prompt } = job.data;
    
    if (slideId && userId) {
      await logFailedSlideJobService(userId, slideId, prompt, err.message, job.id);
      console.log(`Logged failed slide correction job for slide ID ${slideId}`);
    } else {
      console.error(`Insufficient data to log failed slide job for job ID ${job.id}`);
    }
  } catch (error) {
    console.error(`Error logging failed slide correction job for job ID ${job.id}:`, error);
  }
});

slideCorrectionWorker.on('error', (err) => {
  console.error('Slide correction worker error:', err);
});

module.exports = { slideCorrectionWorker };