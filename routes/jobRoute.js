const express = require('express');
const router = express.Router();


router.get("/", async (req, res) => {
    try {
        // Start the background jobs
        res.status(200).json({
            status: 'success',
            message: 'Welcome to GidiPitch API Service'
        });
    } catch (error) {
        console.error('Error starting background jobs:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to start background jobs'
        });
    }
});


// Export the router
module.exports = router;