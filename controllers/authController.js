// auth controlles module
const crypto = require('crypto')
const { AppError } = require('../utils/error');
const { createUserService, updateUserService, getUserByEmailService, revokeTokenService, 
    deleteUserService
} = require('../services/authService');
const { validateEmail, validatePhone, validatePassword } = require('../utils/validators');
const { hashPassword, verifyPassword } = require('../utils/hashPassword');
 const { createJwtToken, verifyJwtToken } = require('../utils/jwtAuth');
const { addEmailJob } = require('../jobs/email/queue');
const { generateOtpEmail } = require('../templates/welcomeEmail');
const { generateForgotPasswordEmail } = require('../templates/resetPasswordEmail');
const { setRedisCache, getRedisCache, deleteRedisCache } = require('../config/redis');
const { hashString } = require('../utils/hashString');
const { sanitize } = require('../utils/helper');
const Resume = require("../models/Resume");


// Local user registration controller
const createLocalUser = async (req, res, next) => {
    try {
        // extract email and password from request body
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new AppError('Email and password are required', 400));
        }
        // validate email format
        if (!validateEmail(email)) {
            return next(new AppError('Invalid email format', 400));
        }
        // validate password strength
        if (!validatePassword(password)) {
            return next(new AppError('Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character', 400));
        }
        // hash the password
        const hashedPassword = await hashPassword(password);

        // Create user object and sanitize inputs
        const userData = {
            email: sanitize(email.toLowerCase().trim()),
            password: hashedPassword,
            authProvider: 'local'
        }

        // create the user in the database
        const newUser = await createUserService(userData);

        // Verify that user has not requested an otp recently
        const key = `otp:${newUser.email}`;
        const existingOtp = await getRedisCache(key);
        if (existingOtp) {
            return next(new AppError('An OTP has already been sent to this email. Please check your email or try again later.', 429));
        }

        // generate 6 digit OTP for email verification
        const otp = crypto.randomInt(100000, 1000000).toString();
        // hash otp and save in redis with 30 minutes expiry
        const otpHash = hashString(otp);
        await setRedisCache(key, otpHash, 30 * 60); // 30 minutes expiry

        // send welcome email with otp
        const welcomeEmailData = {
            to: newUser.email,
            subject: "Welcome to GidiPitch, verify your email",
            text: "Please verify your email address using the OTP code",
            html: generateOtpEmail(newUser.email, otp),
            from: "noreply@thebigphotocontest.com"
        }
        await addEmailJob(welcomeEmailData);

        // delete password from response
        newUser.password = undefined;

        return res.status(201).json({
            status: "success",
            message: "User created successfully! Please check your email for the OTP to verify your email address.",
            user: newUser.toJSON()
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Error creating user:', error);
        next(new AppError('An error occurred while creating the user, try again later', 500));
    }
};


// Verify local user email contoller
const verifyLocalUserEmailController = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return next(new AppError('Email and OTP are required', 400));
        }

        // fetch user by email
        const user = await getUserByEmailService(sanitize(email.toLowerCase().trim()));
        if (!user) {
            return next(new AppError('User not found', 404));
        }
        // check if user is already verified
        if (user.emailVerified) {
            return next(new AppError('Email is already verified', 400));
        }
        
        // Get otp from redis and verify otp
        const key = `otp:${user.email}`;
        const storedOtpHash = await getRedisCache(key);
        if (!storedOtpHash) {
            return next(new AppError('OTP has expired or is invalid, please request a new one', 400));
        }
        const otpHash = hashString(otp);
        if (otpHash !== storedOtpHash) {
            return next(new AppError('Invalid OTP, please try again', 400));
        }

        // update user emailVerified to true
        const updatedUser = await updateUserService(user.email, { emailVerified: true });
        if (!updatedUser) {
            return next(new AppError('Failed to verify email, please try again later', 500));
        }

        // delete otp from redis
        await deleteRedisCache(key);
        
        // delete password from response
        updatedUser.password = undefined;

        // create a 7 days JWT token
        const token = createJwtToken(updatedUser.toObject(), '7d');

        // set response cookie with the token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // use secure cookies in production
            sameSite: 'none', // prevent CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            status: "success",
            message: "Email verified successfully!",
            user: updatedUser.toJSON()
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Error verifying email:', error);
        next(new AppError('An error occurred while verifying email, try again later', 500));
    }
}


// handle social login controller
const handleSocialLoginUser = async (req, res, next) => {
    try {
        const { user, isNew } = req.user; // user object from passport middleware
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // set response cookie with the token
        const loginToken = createJwtToken(user.toObject(), '7d'); // create JWT token with 7 days expiry
        // set token in redis with 24hr expiry
        const tokenHash = hashString(loginToken);
        await setRedisCache(tokenHash, 'active', 24 * 60 * 60); // 24 hours expiry

        if (isNew) {
            res.redirect(`${process.env.LIVE_URL}/onboarding?token=${loginToken}`);
        } else {
            res.redirect(`${process.env.LIVE_URL}/dashboard?token=${loginToken}`);
        }
    } catch (error) {
        next(error);
    }
};


const loginLocalUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!validateEmail(email)) {
            return next(new AppError('Invalid email format', 400));
        }
        if (!validatePassword(password)) {
            return next(new AppError('Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character', 400));
        }

        // fetch user by email
        const user = await getUserByEmailService(email);
        if (!user) {
            return next(new AppError('Invalid email or password', 401));
        }
        // verify user password
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return next(new AppError('Invalid email or password', 401));
        }

        // create a 7 days JWT token
        const token = createJwtToken(user.toObject(), '7d');

        // set response cookie with the token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // use secure cookies in production
            sameSite: 'none', // prevent CSRF attacks
            maxAge: 7* 24 * 60 * 60 * 1000 // 7 days expiry
        });
        // delete user password from the response
        user.password = undefined;
        return res.status(200).json({
            status: "success",
            message: "Login successful!",
            user: user.toJSON()
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        next(new AppError('An error occurred while logging in, try again later', 500));
    }
}


// user forgot password controller
const userForgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return next(new AppError('Email is required', 400));
        }
        if (!validateEmail(email)) {
            return next(new AppError('Invalid email format', 400));
        }

        // fetch user by email
        const user = await getUserByEmailService(email);

        // send forgot password email if user exists
        if (user) {
            // create a reset password token
            const resetToken = createJwtToken({ email: user.email, id: user._id }, '5m');
            // create reset password url
            const resetUrl = `${process.env.FRONTEND_URL}/auth/password/reset?token=${resetToken}`;

            const resetPasswordEmailData = {
                to: user.email,
                subject: "Reset Your Password",
                text: "Click the link below to reset your password",
                html: generateForgotPasswordEmail(resetUrl),
                from: "noreply@thebigphotocontest.com"
            };

            await addEmailJob(resetPasswordEmailData);
        }

        return res.status(200).json({
            status: "success",
            message: "If the email exists, a reset password link has been sent to your email."
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        next(new AppError('An error occurred while processing your request, try again later', 500));
    }
}


// reset password controller
const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.query;
        const { newPassword, confirmPassword } = req.body;
        if (!token) {
            return next(new AppError('Token is required', 400));
        }
        if (!newPassword || !confirmPassword) {
            return next(new AppError('New password and confirm password are required', 400));
        }
        if (newPassword !== confirmPassword) {
            return next(new AppError('New password and confirm password do not match', 400));
        }
        if (!validatePassword(newPassword)) {
            return next(new AppError('Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character', 400));
        }

        // verify the JWT token
        let decoded;
        try {
            decoded = verifyJwtToken(token);
        } catch (error) {
            if (error.message === 'Token has expired') {
                return next(new AppError('Token has expired', 401));
            }
            if (error.message === 'Invalid token') {
                return next(new AppError('Invalid token', 401));
            }
            return next(new AppError('An error occurred while verifying the token', 500));
        }

        // verify if token is revoked
        const tokenHash = hashString(token);
        const tokenStatus = await getRedisCache(tokenHash);
        if (tokenStatus === 'revoked') {
            return next(new AppError('Cannot use this token! Token has been revoked.', 403));
        }

        // fetch user by email
        const user = await getUserByEmailService(decoded.email);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // hash the new password
        const hashedPassword = await hashPassword(newPassword);
        // update user password
        const updatedUser = await updateUserService(user.email, { password: hashedPassword });
        if (!updatedUser) {
            return next(new AppError('Failed to update password', 500));
        }

        // Revoke token
        const ttl = decoded.exp - Math.floor(Date.now() / 1000); // current time in seconds
        if (ttl > 0) {
            await setRedisCache(tokenHash, "revoked", ttl);
        }

        // delete user password from the response
        updatedUser.password = undefined;
        return res.status(200).json({
            status: "success",
            message: "Password reset successfully!",
            user: updatedUser.toJSON()
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Error resetting password:', error);
        next(new AppError('An error occurred while resetting your password, try again later', 500));
    }
};


// logout controller
const logoutUser = async (req, res, next) => {
    try {
        // get token from cookies
        const token = req.cookies.token;

        // clear token in cookies
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // use secure cookies in production
            sameSite: 'none' // prevent CSRF attacks
        });

        // revoke token
        const revoked = await revokeTokenService(token);
        if (!revoked) {
            return next(new AppError('An error occurred while revoking the token', 500));
        }

        return res.status(200).json({
            status: "success",
            message: "Logged out successfully!"
        });

    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Error logging out:', error);
        return next(new AppError('An error occurred while logging out, try again later', 500));
    }
};

const deleteUser = async (req, res, next) => {
    try {
    const user = req.user;
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Delete user from database
    const deletedUser = await deleteUserService(user._id);
    if (!deletedUser) {
        return next(new AppError('Failed to delete user', 500));
    }
    res.clearCookie("token", {
        httpOnly:true,
        secure: process.env.Node_ENV === "production",
        sameSite: "none"
    });
    res.status(200).json({
        status: "success",
        message: "User account deleted successfully"
    });
    } catch (err) {
        console.error("Delete user error:", err.message);
        if (err instanceof AppError) {
            return next(err);
        }
        return next(new AppError('An error occurred while deleting your account, try again later', 500));
    }
};


// Get User Controller
const getUserController = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        return res.status(200).json({
            status: "success",
            message: "User retrieved successfully",
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Error retrieving user:', error);
        if (error instanceof AppError) {
            return next(error);
        }
        return next(new AppError('An error occurred while retrieving user data, try again later', 500));
    }
};


// Update User Controller (for updating user password, fistname, lastname, industry, target audience, goals)
const updateUserController = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return next(new AppError("User not found", 404));
        }

        const { firstname, lastname, newPassword, oldPassword, industry, target_audience, goals, team_size, startup_goal } = req.body;

        const updateData = {};

        if (firstname) updateData.firstname = sanitize(firstname.trim().toLowerCase());
        if (lastname) updateData.lastname = sanitize(lastname.trim().toLowerCase());
        if (industry) updateData.industry = sanitize(industry.trim().toLowerCase());
        if (target_audience) updateData.target_audience = sanitize(target_audience.trim().toLowerCase());
        if (goals && Array.isArray(goals)) updateData.goals = goals.map(goal => sanitize(goal.trim().toLowerCase()));
        if (team_size) updateData.team_size = sanitize(team_size.trim());
        if (startup_goal) updateData.startup_goal = sanitize(startup_goal.trim().toLowerCase());

        // If updating password, verify old password and validate new password
        if (newPassword || oldPassword) {
            if (!newPassword || !oldPassword) {
                return next(new AppError('Both old password and new password are required to update password', 400));
            }

            if (user.authProvider !== 'local') {
                return next(new AppError('Password update is only available for local authentication users', 400));
            }

            // validate old and new password
            if (!validatePassword(oldPassword) || !validatePassword(newPassword)) {
                return next(new AppError('Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character', 400));
            }

            // verify old password
            const isOldPasswordValid = await verifyPassword(oldPassword, user.password);
            if (!isOldPasswordValid) {
                return next(new AppError('Old password is incorrect', 401));
            }

            // hash new password
            const hashedNewPassword = await hashPassword(newPassword);
            updateData.password = hashedNewPassword;
        }
        // Update user data
        const updatedUser = await updateUserService(user.email, updateData);

        // Delete password from response
        updatedUser.password = undefined;

        return res.status(200).json({
            status: "success",
            message: "User updated successfully",
            user: updatedUser.toJSON()
        });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error instanceof AppError) {
            return next(error);
        }
        return next(new AppError('An error occurred while updating user data, try again later', 500));
    }
};


// Set cookie controller
const setCookieController = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return next(new AppError('Token is required', 400));
        }

        // Ensure token was generated by our server
        const tokenhash = hashString(token);
        const tokenStatus = await getRedisCache(tokenhash);
        if (!tokenStatus || tokenStatus !== 'active') {
            return next(new AppError('Invalid token', 401));
        }

        // delete toekn hash
        await deleteRedisCache(tokenhash);

        // decode token to get user data
        let decoded;
        try {
            decoded = verifyJwtToken(token);
        } catch (error) {
            if (error.message === 'Token has expired') {
                return next(new AppError('Token has expired', 401));
            }
            if (error.message === 'Invalid token') {
                return next(new AppError('Invalid token', 401));
            }
            return next(new AppError('An error occurred while verifying the token', 500));
        }

        // set response cookie with the token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // use secure cookies in production
            sameSite: 'none', // prevent CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiry
        });

        return res.status(200).json({
            status: "success",
            message: "Cookie set successfully",
            user: decoded
        });
    } catch (error) {
        console.error('Error setting cookie:', error);
        if (error instanceof AppError) {
            return next(error);
        }
        return next(new AppError('An error occurred while setting cookie, try again later', 500));
    }
}

//export modules
module.exports = {
    createLocalUser,
    verifyLocalUserEmailController,
    handleSocialLoginUser,
    loginLocalUser,
    userForgotPassword,
    resetPassword,
    logoutUser,
    deleteUser,
    getUserController,
    updateUserController,
    setCookieController
}