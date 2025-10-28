const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { submitFeedback } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

// Middleware for validation
const validateFeedback = [
    body('message', 'Feedback message cannot be empty').not().isEmpty().trim().escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// POST route to submit feedback. It's protected, so only logged-in users can access it.
router.post('/feedback', protect, validateFeedback, submitFeedback);

module.exports = router;