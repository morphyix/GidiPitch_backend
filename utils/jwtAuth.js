const jwt = require('jsonwebtoken');
const { AppError } = require('./error');


// create jwt token and payload
const createJwtToken = (userObj, expiry) => {
    const payload = userObj;
    const options = {
        expiresIn: expiry || '1h', // default expiry time is 1 hour
    };
    try {
        const token = jwt.sign(payload, process.env.JWT_SECRET, options);
        return token;
    } catch (error) {
        console.error('Error creating JWT token:', error);
        throw new AppError('Error creating JWT token', 500);
    }
};


// verify jwt token
const verifyJwtToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token has expired', 400);
        }
        if (error.name === 'JsonWebTokenError') {
            throw new AppError('Invalid token', 400);
        }
        throw new AppError('Error verifying token: ' + error.message, 400);
    }
};


// export modules
module.exports = {
    createJwtToken,
    verifyJwtToken
};