const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createPitchDeckController, getPitchDeckProgressController, getIndustrySlidesController,
    getAllIndustriesController, correctSlideController, trackSlideCorrectionProgressController,
 } = require('../controllers/pitchDeckController');

const router = express.Router();

router.post('/create', authMiddleware, createPitchDeckController);
router.get('/industries', getAllIndustriesController);
router.put('/correct/:slideId', authMiddleware, correctSlideController);
router.get('/correction/progress/:slideId', authMiddleware, trackSlideCorrectionProgressController);
router.get('/slides/:industry', getIndustrySlidesController);
router.get('/progress/:deckId', authMiddleware, getPitchDeckProgressController);

// export the router
module.exports = router;