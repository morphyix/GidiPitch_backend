// Custom Error class for handling errors in the application
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Indicates if the error is operational or programming error
        Error.captureStackTrace(this, this.constructor);
    }
};


module.exports = { AppError };