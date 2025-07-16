const express = require('express');
const { createPitchDeckController, getUserPitchDecksController, getPitchDeckByIdController, deletePitchDeckController } = require('../controllers/pitchDeckController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

console.log('deletePitchDeckController:', typeof deletePitchDeckController);


// routes
router.post('/create', authMiddleware, createPitchDeckController);
router.get('/', authMiddleware, getUserPitchDecksController);
router.get('/:id', authMiddleware, getPitchDeckByIdController);
router.delete('/:id', authMiddleware, deletePitchDeckController);


// Export the router
module.exports = router;