const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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

const updateUserRules = () => [
    body('firstName').optional({ checkFalsy: true }).isString().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters.'),
    body('lastName').optional({ checkFalsy: true }).isString().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters.'),
    // --- UPDATED: Added nickname validation ---
    body('nickname').optional({ checkFalsy: true }).isString().trim().isLength({ min: 1, max: 50 }).withMessage('Nickname must be between 1 and 50 characters.'),
    body('city').optional({ checkFalsy: true }).isString().trim().isLength({ max: 100 }).withMessage('City cannot exceed 100 characters.'),
    body('county').optional({ checkFalsy: true }).isString().trim().isLength({ max: 100 }).withMessage('County cannot exceed 100 characters.'),
    body('studentId').optional({ checkFalsy: true }).isString().trim().isLength({ max: 50 }).withMessage('Student ID cannot exceed 50 characters.'),
    body('yearGroup').optional({ checkFalsy: true }).isNumeric().withMessage('Year group must be a valid number.').toInt(),
];

const rateGameRules = () => [ body('rating', 'Rating must be a number between 1 and 5').isFloat({ min: 1, max: 5 }) ];

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