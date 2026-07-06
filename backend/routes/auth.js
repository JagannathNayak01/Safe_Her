const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, forgotPassword, resetPassword, verifyOtp, resendOtp } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validators');

// @route POST /api/auth/register
router.post('/register', validateRegister, register);

// @route POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// @route POST /api/auth/resend-otp
router.post('/resend-otp', resendOtp);

// @route POST /api/auth/login
router.post('/login', validateLogin, login);

// @route POST /api/auth/logout
router.post('/logout', logout);

// @route GET  /api/auth/me
router.get('/me', auth, getMe);

// @route POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);

module.exports = router;
