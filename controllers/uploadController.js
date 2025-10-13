const { AppError } = require('../utils/error');
const { uploadImageService, deleteFileService } = require('../services/uploadService');
const { extractFileKey } = require('../utils/helper');


// Controller to handle image upload
const uploadImageController = async (req, res, next) => {
    try {
        const { action } = req.body;
        if (!action || (action !== 'upload' && action !== 'delete')) {
            return next(new AppError("Action is required and must be either 'upload' or 'delete'", 400));
        }

        if (!req.file) {
            return next(new AppError('No file uploaded', 400));
        }

        const fileKey = await uploadImageService(req.file);
        if (!fileKey) {
            return next(new AppError('Failed to upload image', 500));
        }
         const imageUrl = `${process.env.CDN_URL}/${fileKey}`;

        res.status(200).json({
            status: 'success',
            message: 'Image uploaded successfully',
            data: {
                imageUrl,
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