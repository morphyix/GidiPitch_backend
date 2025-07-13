const express = require('express');
const passport = require('passport');
const { setupLocalRegistration, createLocalUser, handleSocialLoginUser, loginLocalUser, userForgotPassword, resetPassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { rateLimiter } = require('../config/rateLimit');

const router = express.Router();


router.post('/init', setupLocalRegistration);
router.post('/local', rateLimiter, createLocalUser);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), handleSocialLoginUser);
router.post('/login', rateLimiter, loginLocalUser);
router.post('/forgot-password', userForgotPassword);
router.post('/reset-password', resetPassword);


// export the router
module.exports = router;