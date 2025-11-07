const express = require('express');
const router = express.Router();
const { 
    registerStart, registerVerify, registerComplete, 
    login, forgotPassword, resetPassword, refreshToken,
    verifyInviteToken, completeInvitedRegistration,
    publicRegisterStart, publicRegisterVerify, publicRegisterComplete // <-- Import new controllers
} = require('../controllers/authController');
const { 
    validate, registerStartRules, registerVerifyRules, 
    registerCompleteRules, loginRules, forgotPasswordRules, 
    resetPasswordRules 
} = require('../middleware/validator');
const { body } = require('express-validator'); // Import body for inline validation


const rateLimit = require('express-rate-limit'); // --- THIS IS THE FIX: Import rate-limit



const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // Recommended setting
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: { msg: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// --- INVITED STUDENT REGISTRATION ROUTES (Unchanged) ---
router.get('/verify-invite/:token', verifyInviteToken);
router.post('/complete-invite/:token', completeInvitedRegistration);
router.post('/register/start', registerStartRules(), validate, registerStart);
router.post('/register/verify', registerVerifyRules(), validate, registerVerify);
router.post('/register/complete', registerCompleteRules(), validate, registerComplete);


// ROUTES FOR PUBLIC MULTI-STEP REGISTRATION
router.post('/public/start', authLimiter, [ // <-- Apply limiter
    body('email', 'A valid email is required').isEmail()
], validate, publicRegisterStart);

router.post('/public/verify', authLimiter, [ // <-- Apply limiter
    body('email', 'A valid email is required').isEmail(),
    body('code', 'Verification code must be 6 digits').isLength({ min: 6, max: 6 })
], validate, publicRegisterVerify);


router.post('/public/complete', [
    body('email', 'A valid email is required').isEmail(),
    body('code', 'Verification code must be 6 digits').isLength({ min: 6, max: 6 }),
    body('fullName', 'Full name is required').not().isEmpty(),
    body('username', 'Username is required').not().isEmpty(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
], validate, publicRegisterComplete);

// --- OTHER AUTH ROUTES (Unchanged) ---
router.post('/login', authLimiter, loginRules(), validate, login); // <-- Apply limiter
router.post('/forgot-password', authLimiter, forgotPasswordRules(), validate, forgotPassword); // <-- Apply limiter
router.put('/reset-password/:resetToken', resetPasswordRules(), validate, resetPassword);
router.post('/refresh', refreshToken);

module.exports = router;