const Game = require('../models/Game');

// @desc    Get all games from the database
// @route   GET /api/games
// @access  Private
exports.getGames = async (req, res) => {
    try {
        // This now correctly fetches the games that were added by the seeder.
        const games = await Game.find({});
        res.json(games);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Rate a game
// @route   POST /api/games/:id/rate
// @access  Private
exports.rateGame = async (req, res) => {
    const { rating } = req.body;
    const { id: gameId } = req.params;
    const userId = req.user.id;

    try {
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ msg: 'Game not found' });
        }

        const existingRatingIndex = game.ratings.findIndex(r => r.user.toString() === userId);

        if (existingRatingIndex > -1) {
            game.ratings[existingRatingIndex].rating = rating;
        } else {
            game.ratings.push({ user: userId, rating });
        }

        await game.save();

        res.json(game);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};