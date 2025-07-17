// auth controlles module
const { AppError } = require('../utils/error');
const { createUserService, updateUserService, getUserByEmailService, revokeTokenService } = require('../services/authService');
const { validateEmail, validatePhone, validatePassword } = require('../utils/validators');
const { hashPassword, verifyPassword } = require('../utils/hashPassword');
 const { createJwtToken, verifyJwtToken } = require('../utils/jwtAuth');
const { addEmailJob } = require('../jobs/email/queue');
const { generateWelcomeEmail } = require('../templates/welcomeEmail');
const { generateForgotPasswordEmail } = require('../templates/resetPasswordEmail');
const { setRedisCache, getRedisCache } = require('../config/redis');
const { hashString } = require('../utils/hashString');
const Resume = require("../models/Resume");


// Initiate local registration controller
const setupLocalRegistration = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return next(new AppError('Email is required', 400));
        }

        // check if email is valid
        if (!validateEmail(email)) {
            return next(new AppError('Invalid email format', 400));
        }
        // check if email already exists
        try {
            const existingUser = await getUserByEmailService(email);
            if (existingUser) {
                return next(new AppError('User with this email already exists, please login instead', 400));
            }
        } catch (error) {
            console.error('Error checking existing user:', error);
        }
        // Generate a JWT token for email verification and signup completion
        const token = createJwtToken({ email }, '24h'); // 24 hours expiry
        if (!token) {
            return next(new AppError('An error occurred while generating the token, please try again later', 500));
        }
        // create url for user to complete registration
        const verifyUrl = `${process.env.FRONTEND_URL}/auth/local?token=${token}`;
        // send email with verification link
        const welcomeEmailData = {
            to: email,
            subject: "Welcome to GidiPitch, Complete Your Registration",
            text: "Please complete your registration by verifying your email address",
            html: generateWelcomeEmail('New User', verifyUrl),
            from: "noreply@thebigphotocontest.com"
        };
        // add welcome email to queue
        await addEmailJob(welcomeEmailData);

        return res.status(200).json({
            status: "success",
            message: "Registration initiated successfully! Please check your email to complete the registration process."
        });
    } catch (error) {
        if (error instanceof AppError) {
            return next(error); // Re-throw custom AppError
        }
        console.error('Error setting up local registration:', error);
        return next(new AppError('An error occurred while setting up registration, please try again later', 500));
    }
};

// user registration controller
const createLocalUser = async (req, res, next) => {
    try {
        // extract user data from request body
        const token = req.query.token;
        if (!token) {
            return next(new AppError('Token is required', 400));
        }
        // verify the JWT token
        const hashedToken = hashString(token);
        const tokeStatus = await getRedisCache(hashedToken);
        if (tokeStatus === 'revoked') {
            return next(new AppError('Cannot use this token! Token has been revoked.', 403));
        }

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
        if (!decoded || !decoded.email) {
            return next(new AppError('Invalid token data', 400));
        }
        // validate user data
        if (!validateEmail(decoded.email)) {
            return next(new AppError('Invalid email format', 400));
        }
        const { firstname, lastname, password, confirmPassword } = req.body;
        if (!firstname || !lastname || !password || !confirmPassword) {
            return next(new AppError('All fields are required', 400));
        }
        if (!validatePassword(password)) {
            return next(new AppError('Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character', 400));
        }

        if (password !== confirmPassword) {
            return next(new AppError('Password and confirm password do not match', 400));
        }

        // hash user password
        const hashedPassword = await hashPassword(password);

        // create user object
        const user = {
            email: decoded.email.toLowerCase().trim(),
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            password: hashedPassword,
            emailVerified: true, // set email verified to true since user is completing registration
        };

        // create user using the service
        const userObj = await createUserService(user);

        // token for user login
        const loginToken = createJwtToken(userObj.toObject(), '7d'); // create JWT token with 7 days expiry
        if (!loginToken) {
            return next(new AppError('An error occurred while creating the login token, please try again later', 500));
        }
        // set response cookie with the token
        res.cookie('token', loginToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // use secure cookies in production
            sameSite: 'Strict', // prevent CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000
        }); // 7 days

        // delete user password from the response
        userObj.password = undefined;

        // revoke the token used for registration
        const tokenHash = hashString(token);
        await setRedisCache(tokenHash, "revoked", 24 * 60 * 60); // revoke token for 24 hours

        return res.status(201).json({
            status: "success",
            message: "User created successfully!",
            user: userObj.toObject() // return user object without password
        });
    } catch (error) {
        next(error);
    }
};


// handle social login controller
const handleSocialLoginUser = async (req, res, next) => {
    try {
        const { user, isNew } = req.user; // user object from passport middleware
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // set response cookie with the token
        const loginToken = createJwtToken(user.toObject(), '7d'); // create JWT token with 7 days expiry
        res.cookie('token', loginToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // use secure cookies in production
            sameSite: 'Strict', // prevent CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            status: "success",
            message: isNew ? "User created and logged in successfully!" : "User logged in successfully!",
            user: user.toObject()
        });
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
        console.log('Password verification result:', isPasswordValid);
        if (!isPasswordValid) {
            return next(new AppError('Invalid email or password', 401));
        }

        // create a 7 days JWT token
        const token = createJwtToken(user.toObject(), '7d');

        // set response cookie with the token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // use secure cookies in production
            sameSite: 'Strict', // prevent CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        // delete user password from the response
        user.password = undefined;
        return res.status(200).json({
            status: "success",
            message: "Login successful!",
            user: user.toObject()
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
            const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

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
            user: updatedUser.toObject()
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
            sameSite: 'Strict' // prevent CSRF attacks
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

const deleteUser = async (req, res) => {
    try {
    const userId = req.user.id;

    //To delete related resume or data
    await User.findByIdAndDelete(userId);

    res.clearCookie("token", {
        httpOnly:true,
        secure: process.env.Node_ENV === "production",
        sameSite: "strict"
    });
    res.status(200).json({
        message: "Account deleted and logged out."
    });
} catch (err) {
    console.error("Delete user error:", err.message);
    res.status(500).json({
        message: "Server error"
    });
} };

//export modules
module.exports = {
    setupLocalRegistration,
    createLocalUser,
    handleSocialLoginUser,
    loginLocalUser,
    userForgotPassword,
    resetPassword,
    logoutUser,
    deleteUser,
}