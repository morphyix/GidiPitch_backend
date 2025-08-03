const express = require('express');
const router = express.Router();
const { exportPitchDeckToPDF, exportController } = require('../controllers/exportController');


router.get('/export/:deckId', exportPitchDeckToPDF);
// router.post('/export/pptx', exportController.exportToPPTX);

module.exports = router;