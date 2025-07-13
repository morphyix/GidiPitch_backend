const bcrypt = require('bcrypt');
const { AppError } = require('./error');


// hash password function
const hashPassword = async (password) => {
    try {
        // retrieve salt rounds from environment variables or use a default value
        const saltRounds = parseInt(process.env.SALT_ROUNDS) || 13;
        // generate a salt
        const salt = await bcrypt.genSalt(saltRounds);
        // hash password with the generated salt
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        // handle errors during hashing
        throw new AppError('Error hashing password', 500);
    }
};


// compare password function
const verifyPassword = async (password, hashedPassword) => {
    try {
        // compare plain password with hashed password
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    } catch (error) {
        // handle errors during comparison
        throw new AppError('Error verifying password', 500);
    }
};


// export modules
module.exports = {
    hashPassword,
    verifyPassword
};
// This module provides functions to hash and verify passwords using bcrypt.