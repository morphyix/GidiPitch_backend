// Entry point to start all background jobs
require('dotenv').config();

const connectDB = require('../config/db'); // Import the database connection


// start worker function
const startJobs = async () => {
    try {
        // connect to the database
        await connectDB();
        console.log('Database connected successfully.');

        // import and start all job queues and workers
        // import and initialize email worker
        require('./email/worker');

        // import and initialize pitch deck worker
        require('./pitchDeckGenerator/worker');

        // import and initialize slide correction worker
        require('./slideCorrection/worker');

        // Import and initialize export deck worker
        require('./exportDeck/worker');

        console.log('All job queues and workers initialized successfully.');
    } catch (error) {
        console.error('Error starting jobs:', error);
        process.exit(1); // Exit process with failure
    }
};


// start the jobs
startJobs();

// export start job
module.exports = {
    startJobs,
};