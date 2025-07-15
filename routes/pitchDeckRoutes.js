const express = require('express');
const { createPitchDeckController } = require('../controllers/pitchDeckController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();


// routes
router.post('/create', authMiddleware, createPitchDeckController);


// Export the router
module.exports = router;