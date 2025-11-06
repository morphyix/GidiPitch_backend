const mongoose = require('mongoose');
const { AppError } = require('../utils/error');
const User = require('../models/user');
const TokenTransaction = require('../models/tokenTransaction');
const { verifyJwtToken } = require('../utils/jwtAuth');
const { hashString } = require('../utils/hashString');
const { setRedisCache } = require('../config/redis');
const { createTokenTransactionService } = require('./tokenTransactionService');


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
            throw new AppError('User with this email already exists, login manually instead', 400);
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
        // Remove forbidden fields if present in updateData
        const forbiddenFields = ['_id', 'email', 'socialId', 'authProvider', 'tokens']
        forbiddenFields.forEach(field => delete user[field]);
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


// Delete User account service
const deleteUserService = async (userId) => {
    try {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            throw new AppError('Invalid user ID', 400);
        }

        // Delete the user by ID
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            throw new AppError('User not found', 404);
        }

        return true; // return true if deletion is successful
    } catch (error) {
        if (error instanceof AppError) throw error; // Re-throw AppError for handling in the controller
        console.error('Error deleting user:', error);
        throw new AppError('An error occurred while deleting the user', 500);
    }
};


// Add or deduct tokens from user account
const modifyUserTokensService = async (userId, operation, amount, reason, jobId, maxRetries = 5) => {
    let attempt = 0;

    // ✅ Retry loop for transaction conflicts
    while (attempt < maxRetries) {
        const session = await mongoose.startSession();
        
        try {
            // ✅ Set transaction options HERE (not on individual operations)
            session.startTransaction({
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
                readPreference: 'primary',
                maxTimeMS: 1000
            });
            
            attempt++;

            // Validation
            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new AppError('Invalid user ID', 400);
            }
            if (!['add', 'deduct', 'refund'].includes(operation)) {
                throw new AppError('Invalid operation type, must be "add", "deduct" or "refund"', 400);
            }
            if (amount <= 0) {
                throw new AppError('Amount must be greater than zero', 400);
            }

            console.log(`Token ${operation} attempt ${attempt}/${maxRetries} for user ${userId}`);

            // Check for duplicate operations
            let effectiveJobId = jobId;
            if ((operation === 'deduct' || operation === 'refund') && jobId) {
                const existingDeduct = await TokenTransaction.findOne({ 
                    userId, 
                    type: 'deduct', 
                    jobId 
                }).session(session);
                
                const existingRefund = await TokenTransaction.findOne({ 
                    userId, 
                    type: 'refund', 
                    jobId 
                }).session(session);

                if (operation === 'deduct' && existingDeduct) {
                    if (!existingRefund) {
                        console.log(`Deduct operation for jobId ${jobId} already exists, skipping duplicate.`);
                        await session.abortTransaction();
                        session.endSession();
                        return { 
                            updatedUser: await User.findById(userId), 
                            jobId: effectiveJobId,
                            skipped: true 
                        };
                    } else {
                        // Retry scenario
                        const retryCount = await TokenTransaction.countDocuments({ 
                            userId, 
                            jobId: new RegExp(`^${jobId}`) 
                        }).session(session);
                        effectiveJobId = `${jobId}-${retryCount + 1}`;
                        console.log(`Retry detected for job ${jobId}, new jobId: ${effectiveJobId}`);
                    }
                } else if (operation === 'refund' && existingRefund) {
                    console.log(`Refund already processed for ${jobId}`);
                    await session.abortTransaction();
                    session.endSession();
                    return { 
                        updatedUser: await User.findById(userId), 
                        jobId: effectiveJobId,
                        skipped: true 
                    };
                }
            }

            const delta = operation === 'deduct' ? -Math.abs(amount) : Math.abs(amount);

            // ✅ REMOVE writeConcern from individual operation
            const updatedUser = await User.findOneAndUpdate(
                { 
                    _id: userId, 
                    ...(operation === 'deduct' ? { tokens: { $gte: amount } } : {}) 
                },
                { $inc: { tokens: delta } },
                { 
                    new: true, 
                    session
                    // ❌ REMOVED: writeConcern (it's set on the transaction)
                }
            );

            if (!updatedUser) {
                throw new AppError(
                    operation === 'deduct' ? 'Insufficient tokens' : 'User not found', 
                    400
                );
            }

            // Create token transaction record
            if (operation === 'deduct' || operation === 'refund') {
                await createTokenTransactionService(
                    userId, 
                    operation, 
                    0, 
                    amount, 
                    updatedUser.tokens, 
                    'none', 
                    reason, 
                    session, 
                    effectiveJobId
                );
            }

            // ✅ Commit transaction
            await session.commitTransaction();
            session.endSession();

            console.log(`✓ Token ${operation} successful, new balance: ${updatedUser.tokens}`);
            
            return { 
                updatedUser, 
                jobId: effectiveJobId,
                retriedAttempts: attempt - 1 
            };

        } catch (error) {
            // ✅ Abort transaction on error
            await session.abortTransaction();
            session.endSession();

            // ✅ Check if it's a transient transaction error (write conflict)
            const isTransientError = 
                error.errorLabels?.includes('TransientTransactionError') ||
                error.code === 112 || 
                error.codeName === 'WriteConflict' ||
                (error.name === 'MongoServerError' && error.message.includes('Write conflict'));

            if (isTransientError && attempt < maxRetries) {
                // Calculate exponential backoff with jitter
                const baseDelay = 100; // 100ms base for transactions
                const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), 3000);
                const jitter = Math.random() * 100;
                const delay = exponentialDelay + jitter;

                console.warn(
                    `⚠️  Transaction conflict on attempt ${attempt}/${maxRetries}, ` +
                    `retrying in ${Math.round(delay)}ms... (${error.codeName || error.code})`
                );

                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // ✅ Retry
            }

            // ✅ For non-transient errors, throw immediately
            console.error('Error modifying user tokens:', error);
            
            if (error instanceof AppError) throw error;
            
            throw new AppError('An error occurred while modifying user tokens', 500);
        }
    }

    // ✅ Failed after all retries
    throw new AppError(
        `Failed to modify user tokens after ${maxRetries} attempts due to transaction conflicts`, 
        500
    );
};


//export modules
module.exports = {
    createUserService,
    handleSocialLoginService,
    getUserByEmailService,
    updateUserService,
    revokeTokenService,
    deleteUserService,
    modifyUserTokensService
};