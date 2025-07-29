/*const express = require('express');
const { createPitchDeckController, getUserPitchDecksController, getPitchDeckByIdController, deletePitchDeckController,
    createPitchDeckPdfController,
 } = require('../controllers/pitchDeckController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();


// routes
router.post('/create', authMiddleware, createPitchDeckController);
router.get('/', authMiddleware, getUserPitchDecksController);
router.post('/:id/pdf', authMiddleware, createPitchDeckPdfController);
router.get('/:id', authMiddleware, getPitchDeckByIdController);
router.delete('/:id', authMiddleware, deletePitchDeckController);


// Export the router
module.exports = router; */

const express = require('express');
const router = express.Router();
const pitchDeckController = require('../controllers/pitchDeckController');

router.post('/create', pitchDeckController, createPitchDeckController);
router.get('/', pitchDeckController, getAllPitchDecks);
router.get('/:id', pitchDeckController, getPitchDeckById);

module.exports = router;