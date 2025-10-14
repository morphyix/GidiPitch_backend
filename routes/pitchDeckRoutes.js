const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createPitchDeckController, getPitchDeckProgressController, getIndustrySlidesController,
    getAllIndustriesController,
 } = require('../controllers/pitchDeckController');

const router = express.Router();

router.post('/create', authMiddleware, createPitchDeckController);
router.get('/industries', getAllIndustriesController);
router.get('/slides/:industry', getIndustrySlidesController);
router.get('/progress/:deckId', authMiddleware, getPitchDeckProgressController);

// export the router
module.exports = router;