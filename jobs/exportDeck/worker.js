const { Worker } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { AppError } = require('../../utils/error');
const { generateDeckFiles } = require('../../utils/exportDeck');
const { updateDeckByIdService } = require('../../services/deckService');


const exportDeckWorker = new Worker('exportQueue', async (job) => {
    console.log('Processing export job:', job.id);

    const { deckId, startupName, formats } = job.data;
    if (!deckId || !startupName) {
        throw new AppError('Deck ID is required for export', 400);
    }

    if (!formats || (formats.pdf !== true && formats.pptx !== true)) {
        throw new AppError('At least one format (PDF or PPTX) must be specified for export', 400);
    }

    try {
        // Update deck status to 'exporting'
        await updateDeckByIdService(deckId, { status: 'exporting', activityStatus: 'Exporting deck to PPTX and PDF formats' });

        // Generate deck files (PPTX and PDF)
        const { pptxKey, pdfKey } = await generateDeckFiles(deckId);
        const updateData = { status: 'finalized', activityStatus: 'Deck export completed, you can download' };
        if (pptxKey) updateData.pptxKey = pptxKey;
        if (pdfKey) updateData.pdfKey = pdfKey;
        updateData.exportedAt = new Date();

        // Update deck with file keys and set status to 'finalized'
        await updateDeckByIdService(deckId, updateData);
        console.log('Export completed for deck:', deckId);
    } catch (error) {
        console.error('Error during deck export for deck:', deckId, error);
        // Update deck status to 'error' in case of failure
        await updateDeckByIdService(deckId, { status: 'failed', activityStatus: `Error during deck export: ${error.message}` });
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