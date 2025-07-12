const mongoose = require('mongoose');
const { AppError } = require('../utils/error');
const User = require('../models/user');
const { verifyJwtToken } = require('../utils/jwtAuth');
const { hashString } = require('../utils/hashString');
const { setRedisCache } = require('../config/redis');


// This service checks for duplicate users and creates a new user if no duplicates are found.
const createUserService = async (user) => {
    try {
        // Check if the user already exists by email
        const duplicate = await User.findOne({ email: user.email });
        if (duplicate) {
            throw new AppError('User with this email already exits', 400);
        }

        // create a new user if no duplicates are found
        const newUser = await User.create(user);

        return newUser;
    } catch (error) {
        if (error.message === 'User with this email already exits') {
            throw error; // Re-throw the AppError for handling in the controller
        }
        console.error('Error creating user:', error);
        throw new AppError('An error occurred while creating the user', 500);
    }
};


// This service handles social login
const handleSocialLoginService = async (provider, profile) => {
    try {
        // check if user already exists
        const existingUser = await User.findOne({
            authProvider: provider,
            socialId: profile.id
        });

        if (existingUser) {
            // if user exists, return the user
            return { user: existingUser, isNew: false };
        }

        // create a new user if no existing user is found
        const email = profile?.emails[0]?.value?.toLowerCase().trim();
        if (!email) {
            throw new AppError(`Email is required for social login, your ${provider} does not have an email associated, please use another account or signup method`, 400);
        }

        // check if email already exists
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            throw new AppError('User with this email already exists, login instead', 400);
        }

        const userData = {
            firstname: profile.name?.givenName?.trim() || 'No First Name',
            lastname: profile.name?.familyName?.trim() || 'No Last Name',
            email,
            authProvider: provider,
            socialId: profile.id,
            emailVerified: true // assuming social login users are verified
        };

        // create the user in the database
        const newUser = await User.create(userData);

        return { user: newUser, isNew: true };
    } catch (error) {
        if (error instanceof AppError) throw error; // Re-throw AppError for handling in the controller
        console.error('Error handling social login:', error);
        throw new AppError('An error occurred while handling social login', 500);
    }
};


const getUserByEmailService = async (email) => {
    try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    } catch (error) {
        if (error instanceof AppError) throw error; // Re-throw AppError for handling in the controller
        console.error('Error fetching user by email:', error);
        throw new AppError('An error occurred while fetching the user', 500);
    }
};


const updateUserService = async (email, updateData) => {
    try {
        // fetch user by email
        const user = await getUserByEmailService(email);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        // update user data
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                user[key] = updateData[key];
            }
        });
        // save updated user
        const updatedUser = await user.save();
        return updatedUser;
    } catch (error) {
        if (error instanceof AppError) throw error; // Re-throw AppError for handling in the controller
        console.error('Error updating user:', error);
        throw new AppError('An error occurred while updating the user', 500);
    }
};


// revoke token service
const revokeTokenService = async (token) => {
    try {
        let decoded;
        try {
            // verify JWT token
            decoded = verifyJwtToken(token);
        } catch (err) {
            console.error('JWT verification error:', err);
            throw new AppError('Error revoking token, invalid token', 401);
        }
        // hash token for verification
        const hashedToken = hashString(token);
        if (!hashedToken) {
            throw new AppError('An error occurred while hashing the token', 500);
        }
        // calculate expiry time for the token
        const ttl = Math.floor((decoded.exp - Date.now() / 1000) * 1000); // convert to milliseconds
        // store the hashed token in Redis with a TTL
        await setRedisCache(hashedToken, 'revoked', ttl);

        return true; // return true if token is revoked successfully
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw custom AppError
        }
        console.error('Error revoking token:', error);
        throw new AppError('Error revoking token', 500);
    }
};


//export modules
module.exports = {
    createUserService,
    handleSocialLoginService,
    getUserByEmailService,
    updateUserService,
    revokeTokenService,
};