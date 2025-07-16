const express = require('express');
const { createPitchDeckController, getUserPitchDecksController, getPitchDeckByIdController } = require('../controllers/pitchDeckController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();


// routes
router.post('/create', authMiddleware, createPitchDeckController);
router.get('/', authMiddleware, getUserPitchDecksController);
router.get('/:id', authMiddleware, getPitchDeckByIdController);


// Export the router
module.exports = router;