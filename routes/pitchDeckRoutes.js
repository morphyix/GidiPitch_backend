const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createPitchDeckController, getPitchDeckProgressController } = require('../controllers/pitchDeckController');

const router = express.Router();

router.post('/create', authMiddleware, createPitchDeckController);
router.get('/progress/:deckId', authMiddleware, getPitchDeckProgressController);

// export the router
module.exports = router;