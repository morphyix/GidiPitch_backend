const { Worker } = require('bullmq');
const { redisClient } = require('../../config/redis');
const { sendMail } = require('../../utils/mail');
const { AppError } = require('../../utils/error');


// Create a worker to process email jobs
const emailWorker = new Worker('emailQueue', async (job) => {
    try {
        console.log("Proccessing email job:", job.id);
        const { to, subject, text, html, from } = job.data;
        // Call the sendEmail function to send the email
        await sendMail(to, subject, from, text, html);
        console.log("Email job completed:", job.id);
    } catch (error) {
        console.error("Error processing email job:", error);
        // Handle the error, you can rethrow it to retry the job
        throw new AppError('Failed to process email job', 500);
    }
}, { connection: redisClient });

/* listen for worker events
emailWorker.on('completed', (job) => {
    console.log(`Email job completed: ${job.id}`);
});*/

// listen for worker errors
emailWorker.on('failed', (job, err) => {
    console.error(`Email job failed: ${job.id}, Error: ${err.message}`);
});


// export the worker
module.exports = {
    emailWorker
};