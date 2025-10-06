const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createPitchDeckController } = require('../controllers/pitchDeckController');

const router = express.Router();

router.post('/create', authMiddleware, createPitchDeckController);

// export the router
module.exports = router;