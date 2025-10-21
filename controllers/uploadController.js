const { AppError } = require('../utils/error');
const { uploadImageService, deleteFileService } = require('../services/uploadService');
const { updateSlideImageService, getSlideByIdService, updateSlideByIdService } = require('../services/slideService');
const { extractFileKey } = require('../utils/helper');
const { kernel } = require('sharp');


// Controller to handle image upload
const uploadImageController = async (req, res, next) => {
    try {
        const { slideId, caption } = req.body;
        if (!slideId || !caption) {
            return next(new AppError('SlideId and caption are required', 400));
        }

        if (!req.file) {
            return next(new AppError('No file uploaded', 400));
        }

        const fileKey = await uploadImageService(req.file);
        if (!fileKey) {
            return next(new AppError('Failed to upload image', 500));
        }

        // Update slide with new image URL
        const updatedSlide = await updateSlideImageService(slideId, caption, { key: fileKey, source: 'user-uploaded' });
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
        const { slideId, caption } = req.body;
        if (!slideId || !caption) {
            return next(new AppError('SlideId and caption are required', 400));
        }

        // Find the slide to get the image URL
        const slide = await getSlideByIdService(slideId);
        if (!slide) {
            return next(new AppError('Slide not found', 404));
        }

        const image = slide.images.find(img => img.caption === caption);
        if (!image) {
            return next(new AppError('Image with the specified caption not found', 404));
        }

        const imageUrl = image.url;
        if (!imageUrl) {
            return next(new AppError('Image URL not found', 404));
        }

        // Delete the image file
        const deleted = await deleteFileService(imageUrl);
        if (!deleted) {
            return next(new AppError('Failed to delete image', 500));
        }

        // Remove image key from slide image object
        const updatedSlide = await updateSlideImageService(slideId, caption, { key: null });
        if (!updatedSlide) {
            return next(new AppError('Failed to update slide after image deletion', 500));
        }

        res.status(200).json({
            status: 'success',
            message: 'Image deleted successfully',
            data: {
                slide: updatedSlide,
            },
        });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    uploadImageController,
    deleteImageController
};