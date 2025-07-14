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
            throw new Error('Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw new Error('Error verifying token: ' + error.message);
    }
};


// export modules
module.exports = {
    createJwtToken,
    verifyJwtToken
};