const { AppError } = require('../utils/error');
const { verifyJwtToken } = require('../utils/jwtAuth');
const { hashString } = require('../utils/hashString');
const { getRedisCache } = require('../config/redis');
const { getUserByEmailService } = require('../services/authService');


// auth middleware to protect routes
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return next(new AppError('Authentication token is missing', 401));
        }

        // hash the token for verification
        const hashedToken = hashString(token);
        if (!hashedToken) {
            return next(new AppError('An error occured, please try again later', 500));
        }
        // check if token is revoked in redis cache
        const status = await getRedisCache(hashedToken);
        if (status === 'revoked') {
            return next(new AppError('Authentication token has been revoked', 401));
        }

        // verify JWT token
        let decoded;
        try {
            decoded = verifyJwtToken(token);
        }
        catch (err) {
            console.error('JWT verification error:', err);
            return next(new AppError('Invalid authentication token', 401));
        }

        // check is user exists in the database
        const user = await getUserByEmailService(decoded.email);
        if (!user) {
            return next(new AppError('User not found, this token is invalid!', 404));
        }

        // attach user to request object
        req.user = user;
        next(); // proceed to the next middleware or route handler

    } catch (error) {
        if (error instanceof AppError) {
            return next(error); // Re-throw custom AppError
        }
        console.error('Authentication middleware error:', error);
        return next(new AppError('Authentication failed', 500)); // Handle other errors gracefully
    }
};


// Export the auth middleware
module.exports = {
    authMiddleware
};