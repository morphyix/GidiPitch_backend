const express = require('express');
const { startJobs } = require('../jobs/index'); // Import the job starting function

const router = express.Router();


router.get("/", async (req, res) => {
    try {
        // Start the background jobs
        await startJobs();
        res.status(200).json({
            status: 'success',
            message: 'Background jobs started successfully'
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