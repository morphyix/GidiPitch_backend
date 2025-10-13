const express = require('express');
const { uploadImageController, deleteImageController } = require('../controllers/uploadController');

const router = express.Router();

// Route to handle image upload
router.post('/upload', uploadImageController);

// Route to handle image deletion
router.post('/delete', deleteImageController);

module.exports = router;