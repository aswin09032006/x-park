const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Return a structured error with the specific message
        return res.status(400).json({ msg: errors.array()[0].msg });
    }
    next();
};

const registerStartRules = () => [ body('email', 'Please include a valid email').isEmail() ];
const registerVerifyRules = () => [ body('email').isEmail(), body('code').isLength({ min: 6, max: 6 }) ];
const registerCompleteRules = () => [
    body('email').isEmail(),
    body('code').isLength({ min: 6, max: 6 }),
    body('username', 'Username is required').not().isEmpty(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
];

const loginRules = () => [ body('email').isEmail(), body('password').exists() ];
const forgotPasswordRules = () => [ body('email').isEmail() ];
const resetPasswordRules = () => [ body('password').isLength({ min: 6 }) ];

// --- THE DEFINITIVE FIX FOR PROFILE UPDATE VALIDATION ---
const updateUserRules = () => [
    // For optional strings, we allow falsy values (like '') and trim them.
    body('fullName').optional({ checkFalsy: true }).isString().trim().isLength({ min: 1, max: 100 }).withMessage('Full name must be between 1 and 100 characters.'),
    body('displayName').optional({ checkFalsy: true }).isString().trim().isLength({ min: 1, max: 50 }).withMessage('Display name must be between 1 and 50 characters.'),
    body('phoneNumber').optional({ checkFalsy: true }).isString().trim().isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters.'),
    body('city').optional({ checkFalsy: true }).isString().trim().isLength({ max: 100 }).withMessage('City cannot exceed 100 characters.'),
    body('state').optional({ checkFalsy: true }).isString().trim().isLength({ max: 100 }).withMessage('State cannot exceed 100 characters.'),
    body('school').optional({ checkFalsy: true }).isString().trim().isLength({ max: 100 }).withMessage('School cannot exceed 100 characters.'),
    body('studentId').optional({ checkFalsy: true }).isString().trim().isLength({ max: 50 }).withMessage('Student ID cannot exceed 50 characters.'),

    // For optional numbers, we allow falsy values, validate they are numeric, and then CONVERT them to integers.
    // This is the key part of the fix.
    body('ageGroup')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('Age group must be a valid number.')
        .toInt(), // <-- SANITIZE to an integer

    body('yearGroup')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('Year group must be a valid number.')
        .toInt(), // <-- SANITIZE to an integer
];

const rateGameRules = () => [
    body('rating', 'Rating must be a number between 1 and 5').isFloat({ min: 1, max: 5 }),
];


module.exports = {
    validate: handleValidationErrors,
    registerStartRules,
    registerVerifyRules,
    registerCompleteRules,
    loginRules,
    forgotPasswordRules,
    resetPasswordRules,
    updateUserRules,
    rateGameRules
};