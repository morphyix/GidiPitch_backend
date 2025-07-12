const rateLimit = require('express-rate-limit');


// Rate limiting middleware configuration
// This limits number of request to 5 requests per every 15 minutes per IP address
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // limit each IP to 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        status: "error",
        message: "Too many requests from this device, please try again after 15 minutes"
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});


// Export the rate limiter middleware
module.exports = { rateLimiter };