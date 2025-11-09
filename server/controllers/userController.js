const User = require('../models/User');
const { backendLogger } = require('../config/logger');

exports.getMe = async (req, res) => {
    const context = 'userController.getMe';
    const { correlation_id } = req;
    try {
        const user = await User.findById(req.user.id).populate('school', 'name').select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        backendLogger.error('Failed to get user profile.', { context, correlation_id, details: { userId: req.user.id, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updateMe = async (req, res) => {
    const context = 'userController.updateMe';
    const { correlation_id } = req;
    // --- UPDATED: Added 'nickname', removed 'displayName' ---
    const { firstName, lastName, nickname, city, county, studentId, yearGroup, landingPagePreference } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const fieldsToUpdate = {};
        if (firstName !== undefined) fieldsToUpdate.firstName = firstName;
        if (lastName !== undefined) fieldsToUpdate.lastName = lastName;
        
        // --- UPDATED: Automatically update displayName if name changes ---
        if (firstName !== undefined || lastName !== undefined) {
            const newFirstName = firstName !== undefined ? firstName : user.firstName;
            const newLastName = lastName !== undefined ? lastName : user.lastName;
            fieldsToUpdate.displayName = `${newFirstName} ${newLastName}`.trim();
        }

        if (nickname !== undefined) fieldsToUpdate.nickname = nickname;
        if (city !== undefined) fieldsToUpdate.city = city;
        if (county !== undefined) fieldsToUpdate.county = county;
        if (studentId !== undefined) fieldsToUpdate.studentId = studentId;
        if (yearGroup !== undefined) fieldsToUpdate.yearGroup = yearGroup;
        if (landingPagePreference !== undefined) fieldsToUpdate.landingPagePreference = landingPagePreference;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: fieldsToUpdate },
            { new: true, runValidators: true }
        ).select('-password');

        backendLogger.info('User profile updated successfully.', { context, correlation_id, details: { userId: req.user.id } });
        res.json(updatedUser);
    } catch (err) {
        backendLogger.error('Failed to update user profile.', {
            context,
            correlation_id,
            details: { userId: req.user.id, error: err.message, stack: err.stack }
        });
        res.status(500).json({ msg: 'Server error' });
    }
};


exports.completeOnboarding = async (req, res) => {
    const context = 'userController.completeOnboarding';
    const { correlation_id } = req;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        user.isFirstLogin = false;
        await user.save();
        
        backendLogger.success('User onboarding completed.', { context, correlation_id, details: { userId: req.user.id } });
        res.status(200).json({ msg: 'Onboarding complete.' });
    } catch (err) {
        backendLogger.error('Failed to complete user onboarding.', { context, correlation_id, details: { userId: req.user.id, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getSavedGames = async (req, res) => {
    const context = 'userController.getSavedGames';
    const { correlation_id } = req;
    try {
        const user = await User.findById(req.user.id).populate('savedGames');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user.savedGames);
    } catch (err) {
        backendLogger.error('Failed to get saved games.', { context, correlation_id, details: { userId: req.user.id, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.saveGame = async (req, res) => {
    const { gameId } = req.body;
    const context = 'userController.saveGame';
    const { correlation_id } = req;
    try {
        await User.findByIdAndUpdate(req.user.id, { $addToSet: { savedGames: gameId } });
        backendLogger.info('Game saved successfully.', { context, correlation_id, details: { userId: req.user.id, gameId } });
        res.status(200).json({ msg: 'Game saved successfully.' });
    } catch (err) {
        backendLogger.error('Failed to save game.', { context, correlation_id, details: { userId: req.user.id, gameId, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.unsaveGame = async (req, res) => {
    const { gameId } = req.params;
    const context = 'userController.unsaveGame';
    const { correlation_id } = req;
    try {
        await User.findByIdAndUpdate(req.user.id, { $pull: { savedGames: gameId } });
        backendLogger.info('Game unsaved successfully.', { context, correlation_id, details: { userId: req.user.id, gameId } });
        res.status(200).json({ msg: 'Game unsaved successfully.' });
    } catch (err) {
        backendLogger.error('Failed to unsave game.', { context, correlation_id, details: { userId: req.user.id, gameId, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getPlayedGames = async (req, res) => {
    const context = 'userController.getPlayedGames';
    const { correlation_id } = req;
    try {
        const user = await User.findById(req.user.id).populate('playedGames');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user.playedGames);
    } catch (err) {
        backendLogger.error('Failed to get played games.', { context, correlation_id, details: { userId: req.user.id, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.addPlayedGame = async (req, res) => {
    const { gameId } = req.body;
    const context = 'userController.addPlayedGame';
    const { correlation_id } = req;
    try {
        await User.findByIdAndUpdate(req.user.id, { $addToSet: { playedGames: gameId } });
        backendLogger.info('Game added to played list.', { context, correlation_id, details: { userId: req.user.id, gameId } });
        res.status(200).json({ msg: 'Game added to your played list.' });
    } catch (err) {
        backendLogger.error('Failed to add played game.', { context, correlation_id, details: { userId: req.user.id, gameId, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getGameData = async (req, res) => {
    const { gameIdentifier } = req.params;
    const context = `userController.getGameData.${gameIdentifier}`;
    const { correlation_id } = req;
    try {
        const user = await User.findById(req.user.id).lean();
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        const gameProgress = user.gameData ? user.gameData[gameIdentifier] : undefined;
        if (!gameProgress) return res.json({});
        
        res.json(gameProgress);
    } catch (err) {
        backendLogger.error('Failed to get game data.', { context, correlation_id, details: { userId: req.user.id, gameIdentifier, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateGameData = async (req, res) => {
    const { gameIdentifier } = req.params;
    const { stage, score, badge, xp, status, certificate } = req.body;
    const context = `userController.updateGameData.${gameIdentifier}`;
    const { correlation_id } = req;

    if (!stage) return res.status(400).json({ msg: 'Stage identifier is required.' });
    const stageStr = String(stage);

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (!user.gameData.has(gameIdentifier)) {
            user.gameData.set(gameIdentifier, { completedLevels: new Map(), highScores: new Map(), badges: new Map(), xp: new Map(), certificates: new Map() });
        }
        const progress = user.gameData.get(gameIdentifier);

        if (status === 2) progress.completedLevels.set(stageStr, true);
        if (score !== undefined && (score > (progress.highScores.get(stageStr) || 0))) progress.highScores.set(stageStr, score);
        if (badge !== undefined && (String(badge) > (progress.badges.get(stageStr) || "0"))) progress.badges.set(stageStr, String(badge));
        if (xp !== undefined) progress.xp.set(stageStr, (progress.xp.get(stageStr) || 0) + xp);
        if (certificate) progress.certificates.set(stageStr, true);

        await user.save();
        
        backendLogger.info('Game progress updated.', { context, correlation_id, details: { userId: req.user.id, gameIdentifier, stage: stageStr } });
        res.status(200).json({ msg: 'Progress updated.' });
    } catch (err) {
        backendLogger.error('Failed to update game data.', { context, correlation_id, details: { userId: req.user.id, gameIdentifier, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getAllGameData = async (req, res) => {
    const context = 'userController.getAllGameData';
    const { correlation_id } = req;
    try {
        const user = await User.findById(req.user.id).lean();
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user.gameData || {});
    } catch (err) {
        backendLogger.error('Failed to get all game data for user.', { context, correlation_id, details: { userId: req.user.id, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateAvatarPreference = async (req, res) => {
    const { style } = req.body;
    const context = 'userController.updateAvatarPreference';
    const { correlation_id } = req;

    if (!['initials', 'placeholder'].includes(style)) {
        return res.status(400).json({ msg: 'Invalid avatar style provided.' });
    }

    try {
        const user = await User.findByIdAndUpdate(req.user.id, { 'avatar.style': style }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        backendLogger.info('User avatar preference updated.', { context, correlation_id, details: { userId: req.user.id, style } });
        res.json(user);
    } catch (err) {
        backendLogger.error('Failed to update avatar preference.', { context, correlation_id, details: { userId: req.user.id, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server error while updating avatar preference.' });
    }
};

exports.removeAvatarPreference = async (req, res) => {
    const context = 'userController.removeAvatarPreference';
    const { correlation_id } = req;
    try {
        const user = await User.findByIdAndUpdate(req.user.id, { 'avatar.style': 'initials' }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        backendLogger.info('User avatar preference reset.', { context, correlation_id, details: { userId: req.user.id } });
        res.json(user);
    } catch (err) {
        backendLogger.error('Failed to remove avatar preference.', { context, correlation_id, details: { userId: req.user.id, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server error while removing avatar preference.' });
    }
};