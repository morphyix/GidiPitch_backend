const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createPitchDeckController, getPitchDeckProgressController, getIndustrySlidesController,
    getAllIndustriesController, correctSlideController, trackSlideCorrectionProgressController,
    exportPitchDeckFilesController, getPitchDeckFileController, getUserPitchDecksController, deletePitchDeckController
 } = require('../controllers/pitchDeckController');

const router = express.Router();

router.post('/create', authMiddleware, createPitchDeckController);
router.get('/industries', getAllIndustriesController);
router.get('/user', authMiddleware, getUserPitchDecksController);
router.post('/export/:deckId', authMiddleware, exportPitchDeckFilesController);
router.put('/correct/:slideId', authMiddleware, correctSlideController);
router.get('/correction/progress/:slideId', authMiddleware, trackSlideCorrectionProgressController);
router.get('/slides/:industry', getIndustrySlidesController);
router.get('/progress/:deckId', getPitchDeckProgressController);
router.get('/file/:deckId', authMiddleware, getPitchDeckFileController);
router.delete('/delete/:deckId', authMiddleware, deletePitchDeckController);

// export the router
module.exports = router;