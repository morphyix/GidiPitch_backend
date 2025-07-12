// Error Handler Middleware

const errorMiddleware = (err, req, res, next) => {
    // Log the error details for debugging
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    //check if error is operational
    const statusCode = err.isOperational ? err.statusCode || 500 : 500;
    const message = err.isOperational ? err.message || 'Internal Server Error' : 'Something went wrong!';
    // Send the error response
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message
    });
};


// Export the error middleware
module.exports = { errorMiddleware };