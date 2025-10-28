const express = require('express');
const router = express.Router();
const { getGames, rateGame } = require('../controllers/gameController');
const { protect } = require('../middleware/authMiddleware');
const { validate, rateGameRules } = require('../middleware/validator');

// We use 'protect' to ensure only logged-in users can see the games
router.get('/', protect, getGames);
router.post('/:id/rate', protect, rateGameRules(), validate, rateGame);

module.exports = router;