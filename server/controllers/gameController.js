// --- /backend/controllers/gameController.js ---
const Game = require('../models/Game');
const { backendLogger } = require('../config/logger');

// --- THIS IS THE FIX: Removed the logic that calculates school-specific ratings for students ---
exports.getGames = async (req, res) => {
    const context = 'gameController.getGames';
    const { correlation_id } = req;
    try {
        // The controller now simply fetches and returns all games for any user role.
        const games = await Game.find({});
        res.json(games);
    } catch (err) {
        backendLogger.error('Failed to fetch games.', { context, correlation_id, details: { error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.rateGame = async (req, res) => {
    const { rating } = req.body;
    const { id: gameId } = req.params;
    const userId = req.user.id;
    const context = 'gameController.rateGame';
    const { correlation_id } = req;

    try {
        const game = await Game.findById(gameId);
        if (!game) {
            backendLogger.warn('Attempted to rate a non-existent game.', { context, correlation_id, details: { gameId, userId } });
            return res.status(404).json({ msg: 'Game not found' });
        }

        const existingRatingIndex = game.ratings.findIndex(r => r.user.toString() === userId);

        if (existingRatingIndex > -1) {
            // Update existing rating
            game.ratings[existingRatingIndex].rating = rating;
        } else {
            game.ratings.push({ 
                user: userId, 
                rating, 
                userSchool: req.user.school
            });
        }

        await game.save();
        
        backendLogger.success(`User rated game successfully.`, { context, correlation_id, details: { userId, gameId, rating } });
        
        // Return the updated game object, which will have the new global average rating.
        res.json(game);

    } catch (err) {
        backendLogger.error('Failed to rate game.', { context, correlation_id, details: { userId, gameId, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};