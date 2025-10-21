const sharp = require('sharp');
const { s3Client } = require('../config/s3Config');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { AppError } = require('../utils/error');
const { extractFileKey } = require('../utils/helper');


// upload pdf file service
const uploadPdfService = async (file) => {
    try {
        if (!file) {
            throw new AppError('Please upload a PDF file', 400);
        }

        if (file.mimetype !== 'application/pdf') {
            throw new AppError('Invalid file type. Only PDF files are allowed.', 400);
        }

        const fileKey = `gidiPitch/${Date.now()}-${file.originalname}`;
        
        // upload parameters
        const uploadParams = {
            Bucket: process.env.S3_BUCKET,
            Key: fileKey,
            Body: file.buffer,
            ContentType: 'application/pdf',
            ACL: 'public-read',
        };

        // Upload the PDF to S3
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // Return the minio URL of the uploaded PDF
        const pdfUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${fileKey}`;
        return pdfUrl;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error uploading PDF:', error);
        throw new AppError('Failed to upload PDF', 500);
    }
};

// delete file service
const deleteFileService = async (fileUrl) => {
    try {
        if (!fileUrl) {
            throw new AppError('Image URL is required', 400);
        }

        const fileKey = extractFileKey(fileUrl);
        if (!fileKey) {
            throw new AppError('Invalid image URL', 400);
        }
        const decodedKey = decodeURIComponent(fileKey);

        // delete parameters
        const deleteParams = {
            Bucket: process.env.S3_BUCKET,
            Key: decodedKey,
        };

        // Delete the image from S3
        const command = new DeleteObjectCommand(deleteParams);
        await s3Client.send(command);

        return true;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error deleting image:', error);
        throw new AppError('Failed to delete image', 500);
    }
};


const uploadImageService = async (file) => {
    try {
        if (!file) {
            throw new AppError('Please upload an image', 400);
        }

        const allowedTypes = [ 'image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new AppError('Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed.', 400);
        }

        const fileKey = `gidiPitch/${Date.now()}-${file.originalname}`;
        const imageBuffer = await sharp(file.buffer)
            .jpeg({ quality: 80 }) // Convert to Web4 with 80% quality
            .toBuffer();
        
        // upload parameters
        const uploadParams = {
            Bucket: process.env.S3_BUCKET,
            Key: fileKey,
            Body: imageBuffer,
            ContentType: 'image/jpeg', // Set the content type to JPEG
        };

        // Upload the image to S3
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // Return the file key of the uploaded image
        return fileKey;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom errors
        }
        console.error('Error uploading image:', error);
        throw new AppError('Failed to upload image', 500);
    }
};


// Export the services
module.exports = {
    uploadPdfService,
    deleteFileService,
    uploadImageService,
};