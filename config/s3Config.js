const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create an S3 client instance
const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true, // Required for DigitalOcean Spaces
});


// test the connection
const testBucket = async () => {
    try {
        const bucketName = process.env.S3_BUCKET;
        if (!bucketName) throw new Error("Bucket name is not defined in environment variables.");

        console.log(`Checking bucket: ${bucketName}`);
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket "${bucketName}" is accessible.`);
    } catch (error) {
        console.error("Error accessing bucket:", error);
        process.exit(1); // Exit with an error code if the test fails
    }
};

// Export the S3 client instance
module.exports = { s3Client, testBucket };