const express = require('express');
const { createPitchDeckController, getPitchDeckByIdController, deletePitchDeckController,
    createPitchDeckPdfController,
 } = require('../controllers/pitchDeckController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();


// routes
router.post('/create', authMiddleware, createPitchDeckController);
router.post('/:id/pdf', authMiddleware, createPitchDeckPdfController);
router.get('/:id', authMiddleware, getPitchDeckByIdController);
router.delete('/:id', authMiddleware, deletePitchDeckController);


// Export the router
module.exports = router;