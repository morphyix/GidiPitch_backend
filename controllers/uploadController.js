const { AppError } = require('../utils/error');
const { uploadImageService, deleteFileService } = require('../services/uploadService');
const { updateSlideImageService } = require('../services/slideService');
const { extractFileKey } = require('../utils/helper');
const { kernel } = require('sharp');


// Controller to handle image upload
const uploadImageController = async (req, res, next) => {
    try {
        const { slideId, index = 0 } = req.body;
        if (!slideId) {
            return next(new AppError('Slide ID is required', 400));
        }

        if (!req.file) {
            return next(new AppError('No file uploaded', 400));
        }

        const fileKey = await uploadImageService(req.file);
        if (!fileKey) {
            return next(new AppError('Failed to upload image', 500));
        }

        // Update slide with new image URL
        const updatedSlide = await updateSlideImageService(slideId, parseInt(index), { key: fileKey });
        if (!updatedSlide) {
            return next(new AppError('Failed to update slide with image', 500));
        }

        res.status(200).json({
            status: 'success',
            message: 'Image uploaded successfully',
            data: {
                slide: updatedSlide,
            },
        });
    } catch (error) {
        next(error);
    }
};


// Controller to handle image deletion
const deleteImageController = async (req, res, next) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return next(new AppError('Image URL is required', 400));
        }

        const deleted = await deleteFileService(imageUrl);
        if (!deleted) {
            return next(new AppError('Failed to delete image', 500));
        }

        res.status(200).json({
            status: 'success',
            message: 'Image deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    uploadImageController,
    deleteImageController
};