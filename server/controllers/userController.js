const User = require('../models/User');

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updateMe = async (req, res) => {
    // --- UPDATED: Use firstName, lastName ---
    const { firstName, lastName, displayName, phoneNumber, city, state, school, ageGroup, studentId, yearGroup, landingPagePreference } = req.body;
    
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const fieldsToUpdate = {};
        if (firstName !== undefined) fieldsToUpdate.firstName = firstName;
        if (lastName !== undefined) fieldsToUpdate.lastName = lastName;
        if (displayName !== undefined) fieldsToUpdate.displayName = displayName;
        if (phoneNumber !== undefined) fieldsToUpdate.phoneNumber = phoneNumber;
        if (city !== undefined) fieldsToUpdate.city = city;
        if (state !== undefined) fieldsToUpdate.state = state;
        if (school !== undefined) fieldsToUpdate.school = school;
        if (ageGroup !== undefined) fieldsToUpdate.ageGroup = ageGroup;
        if (studentId !== undefined) fieldsToUpdate.studentId = studentId;
        if (yearGroup !== undefined) fieldsToUpdate.yearGroup = yearGroup;
        if (landingPagePreference !== undefined) fieldsToUpdate.landingPagePreference = landingPagePreference;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: fieldsToUpdate },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(updatedUser);
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getSavedGames = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('savedGames');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user.savedGames);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.saveGame = async (req, res) => {
    const { gameId } = req.body;
    try {
        await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { savedGames: gameId } },
            { new: true }
        );
        res.status(200).json({ msg: 'Game saved successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.unsaveGame = async (req, res) => {
    const { gameId } = req.params;
    try {
        await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { savedGames: gameId } },
            { new: true }
        );
        res.status(200).json({ msg: 'Game unsaved successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// --- START: NEW FUNCTIONS FOR GAME DATA ---

// @desc    Get a user's progress for a specific game
// @route   GET /api/users/me/gamedata/:gameIdentifier
// @access  Private
exports.getGameData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const gameProgress = user.gameData.get(req.params.gameIdentifier) || {};
        res.json(gameProgress);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update a user's progress for a specific game
// @route   POST /api/users/me/gamedata/:gameIdentifier
// @access  Private
exports.updateGameData = async (req, res) => {
    const { gameIdentifier } = req.params;
    const { stage, score, badge } = req.body; // Assuming this structure from the game

    if (!stage) return res.status(400).json({ msg: 'Stage identifier is required.' });

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Get existing progress or initialize it
        let progress = user.gameData.get(gameIdentifier) || {
            highScores: new Map(),
            completedLevels: new Map(),
            badges: new Map()
        };

        // Update completed level
        progress.completedLevels.set(stage, true);

        // Update high score if the new score is higher
        if (score && (!progress.highScores.has(stage) || score > progress.highScores.get(stage))) {
            progress.highScores.set(stage, score);
        }

        // Update badge if the new one is better
        if (badge) {
            const badgeHierarchy = { 'bronze': 1, 'silver': 2, 'gold': 3 };
            const currentBadge = progress.badges.get(stage);
            if (!currentBadge || (badgeHierarchy[badge] > badgeHierarchy[currentBadge])) {
                progress.badges.set(stage, badge);
            }
        }
        
        user.gameData.set(gameIdentifier, progress);
        await user.save();
        
        res.status(200).json({ msg: 'Game progress updated successfully.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get all game data for the current user
// @route   GET /api/users/me/gamedata
// @access  Private
exports.getAllGameData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Convert the Map to a plain object for easier JSON serialization
        const gameDataObject = Object.fromEntries(user.gameData);
        
        res.json(gameDataObject);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateAvatarPreference = async (req, res) => {
    const { style } = req.body;

    // Validate the incoming style
    if (!['initials', 'placeholder'].includes(style)) {
        return res.status(400).json({ msg: 'Invalid avatar style provided.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.avatar.style = style;
        await user.save();

        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json(updatedUser);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error while updating avatar preference.' });
    }
};

// --- NEW CONTROLLER: Remove/reset the user's avatar preference to the default ---
exports.removeAvatarPreference = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Reset to the default style defined in the schema
        user.avatar.style = 'initials';
        await user.save();

        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json(updatedUser);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error while removing avatar preference.' });
    }
};
