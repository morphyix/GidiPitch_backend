const express = require('express');
const { createPitchDeckController, getUserPitchDecksController } = require('../controllers/pitchDeckController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();


// routes
router.post('/create', authMiddleware, createPitchDeckController);
router.get('/', authMiddleware, getUserPitchDecksController);


// Export the router
module.exports = router;