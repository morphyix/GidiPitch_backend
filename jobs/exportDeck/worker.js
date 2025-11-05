const { Worker } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');
const { generateDeckFiles } = require('../../utils/exportDeck');
const { updateDeckByIdService } = require('../../services/deckService');
const { deleteFileService } = require('../../services/uploadService');
const { modifyUserTokensService } = require('../../services/authService');


const exportDeckWorker = new Worker('exportQueue', async (job) => {
    console.log('Processing export job:', job.id);
    let pdfTx;
    let pptxTx;

    const { deckId, startupName, formats, oldKeys, userId } = job.data;
    if (!deckId || !startupName) {
        throw new AppError('Deck ID is required for export', 400);
    }

    if (!formats || (formats.pdf !== true && formats.pptx !== true)) {
        throw new AppError('At least one format (PDF or PPTX) must be specified for export', 400);
    }

    try {
        // Deduct tokens for pptx export
        if (formats?.pptx) {
            pptxTx = await modifyUserTokensService(userId, 'deduct', 5, `Exporting pitch deck ${startupName} to PPTX`, `${job.id}-pptx`); // Deduct 5 tokens for PPTX export
        }
        if (formats?.pdf) {
            pdfTx = await modifyUserTokensService(userId, 'deduct', 5, `Exporting pitch deck ${startupName} to PDF`, `${job.id}-pdf`); // Deduct 5 tokens for PDF export
        }
        // Update deck status to 'exporting'
        await updateDeckByIdService(deckId, { status: 'exporting', activityStatus: 'Exporting deck to PPTX and PDF formats' });

        // Generate deck files (PPTX and PDF)
        const { pptxKey, pdfKey } = await generateDeckFiles(deckId, startupName, formats);
        const updateData = { status: 'finalized', activityStatus: 'Deck export completed, you can download' };
        if (pptxKey) {
            updateData.pptxKey = pptxKey;
        }
        if (pdfKey) updateData.pdfKey = pdfKey;
        updateData.exportedAt = new Date();

        // Delete old files if keys are provided
        if (oldKeys) {
            for (const key of oldKeys) {
                try {
                    await deleteFileService(key);
                    console.log('Deleted old file with key:', key);
                } catch (err) {
                    console.error('Error deleting old file with key:', key, err);
                }
            }
        }

        // Update deck with file keys and set status to 'finalized'
        await updateDeckByIdService(deckId, updateData);
        console.log('Export completed for deck:', deckId);
    } catch (error) {
        console.error('Error during deck export for deck:', deckId, error);
        // Update deck status to 'error' in case of failure
        await updateDeckByIdService(deckId, { status: 'failed', activityStatus: `Error during deck export: ${error.message}` });
        if (formats?.pptx) {
            // Refund tokens for failed pptx export
            await modifyUserTokensService(userId, 'refund', 5, `Refund for failed PPTX export of ${startupName}`, pptxTx.jobId); // Refund 5 tokens for failed PPTX export
        }
        if (formats?.pdf) {
            // Refund tokens for failed pdf export
            await modifyUserTokensService(userId, 'refund', 5, `Refund for failed PDF export of ${startupName}`, pdfTx.jobId); // Refund 5 tokens for failed PDF export
        }
        throw error;
    }
}, {
    connection: redisClient,
    concurrency: 2 // Process up to 2 export jobs concurrently
});

exportDeckWorker.on('error', (err) => {
    console.error('Export Deck Worker encountered an error:', err);
});

module.exports = {
    exportDeckWorker
};