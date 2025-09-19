// Passport login for google and facebook login module
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { handleSocialLoginService } = require('../services/authService');
const User = require('../models/user');
const { AppError } = require('../utils/error');


function configurePassport() {
    // Handle Google OAuth strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `/api/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const {user, isNew } = await handleSocialLoginService('google', profile);
            if (!user) return done(new AppError('Failed to login with Google', 500), null);

            done(null, { user, isNew });
        } catch (error) {
            done(error, null);
        }
    }));
}


// export module
module.exports = {
    configurePassport
};