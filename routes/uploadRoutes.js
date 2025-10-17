const express = require('express');
const { uploadImageController, deleteImageController } = require('../controllers/uploadController');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Route to handle image upload
router.post('/upload', upload.single('image'), uploadImageController);

// Route to handle image deletion
router.delete('/delete', deleteImageController);

module.exports = router;