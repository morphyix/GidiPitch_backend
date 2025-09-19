const express = require('express');
const passport = require('passport');
const { createLocalUser, verifyLocalUserEmailController, handleSocialLoginUser, loginLocalUser, userForgotPassword, resetPassword,
    deleteUser, getUserController, updateUserController, setCookieController } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { rateLimiter } = require('../config/rateLimit');

const router = express.Router();


router.post('/local', rateLimiter, createLocalUser);
router.put('/email/verify', rateLimiter, verifyLocalUserEmailController);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), handleSocialLoginUser);
router.post('/login', rateLimiter, loginLocalUser);
router.post('/password/forgot', userForgotPassword);
router.post('/password/reset', resetPassword);
router.put("/", authMiddleware, updateUserController);
router.delete("/", authMiddleware, deleteUser);
router.get("/user", authMiddleware, getUserController);
router.post("/set-cookie", setCookieController);


// export the router
module.exports = router;