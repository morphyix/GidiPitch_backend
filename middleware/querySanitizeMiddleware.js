const mongoSanitize = require('express-mongo-sanitize');


// Middleware to sanitize query parameters
const querySanitizeMiddleware = (req, res, next) => {
    ['query', 'body', 'params'].forEach((key) => {
        if (req[key]) {
            for (const prop in req[key]) {
                if (/^\$/.test(prop)) {
                    // If the property starts with $, remove it
                    delete req[key][prop];
                    console.log(`Removed illegal property: ${prop} from ${key}`);
                }
            }
        }
    });
    next();
}


// Export the middleware
module.exports = { querySanitizeMiddleware };