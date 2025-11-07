const Game = require('../models/Game');
const { backendLogger } = require('../config/logger');

exports.getGames = async (req, res) => {
    const context = 'gameController.getGames';
    const { correlation_id } = req;
    try {
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
            game.ratings[existingRatingIndex].rating = rating;
        } else {
            game.ratings.push({ user: userId, rating });
        }

        await game.save();
        
        backendLogger.success(`User rated game successfully.`, { context, correlation_id, details: { userId, gameId, rating } });
        res.json(game);

    } catch (err) {
        backendLogger.error('Failed to rate game.', { context, correlation_id, details: { userId, gameId, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};