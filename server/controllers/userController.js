const User = require('../models/User');
const mongoose = require('mongoose');

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
    // --- THIS IS THE FIX: Removed ageGroup and changed 'state' to 'county' ---
    const { firstName, lastName, displayName, city, county, school, studentId, yearGroup, landingPagePreference } = req.body;
    
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const fieldsToUpdate = {};
        if (firstName !== undefined) fieldsToUpdate.firstName = firstName;
        if (lastName !== undefined) fieldsToUpdate.lastName = lastName;
        if (displayName !== undefined) fieldsToUpdate.displayName = displayName;
        if (city !== undefined) fieldsToUpdate.city = city;
        if (county !== undefined) fieldsToUpdate.county = county; // Changed from state to county
        if (school !== undefined) fieldsToUpdate.school = school;
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

// --- THIS IS THE FIX: New controller to handle completing the first-login onboarding step ---
exports.completeOnboarding = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.isFirstLogin = false;
        await user.save();
        res.status(200).json({ msg: 'Onboarding complete.' });
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

// --- THIS IS THE FIX: New controller to get played games ---
exports.getPlayedGames = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('playedGames');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user.playedGames);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// --- THIS IS THE FIX: New controller to add a played game ---
exports.addPlayedGame = async (req, res) => {
    const { gameId } = req.body;
    try {
        await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { playedGames: gameId } }
        );
        res.status(200).json({ msg: 'Game added to your played list.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};


/**
 * THIS IS THE DEFINITIVE FIX for GETTING data.
 * It uses .lean() to get a plain JavaScript object directly from the database,
 * bypassing any Mongoose conversion issues that were causing it to return an empty object.
 */
exports.getGameData = async (req, res) => {
    const { gameIdentifier } = req.params;
    console.log(`\n- - - - - [GET /gamedata] [START] User '${req.user.id}' requesting data for '${gameIdentifier}'. - - - - -`);
    try {
        // Use .lean() to get a plain JavaScript object instead of a Mongoose document.
        // This is the single most important change.
        const user = await User.findById(req.user.id).lean();

        if (!user) {
            console.error(`[GET /gamedata] [ERROR] User with ID '${req.user.id}' not found.`);
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Access the data using standard JavaScript object notation.
        const gameProgress = user.gameData ? user.gameData[gameIdentifier] : undefined;

        if (!gameProgress) {
            console.log(`[GET /gamedata] [SUCCESS] No progress found for this game. Sending empty object.`);
            return res.json({});
        }
        
        // The object is already plain, so no .toObject() is needed.
        console.log(`[GET /gamedata] [SUCCESS] Found progress. Sending PLAIN OBJECT to client:`, JSON.stringify(gameProgress, null, 2));
        
        res.json(gameProgress);

    } catch (err) {
        console.error('[GET /gamedata] [CRITICAL ERROR] A server error occurred:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

/**
 * THIS IS THE DEFINITIVE FIX for UPDATING data.
 * It reliably handles updates for both single-stage and multi-stage games by
 * reading the document, modifying the Mongoose Map, and then saving.
 */
exports.updateGameData = async (req, res) => {
    const { gameIdentifier } = req.params;
    const { stage, score, badge, xp, status, certificate } = req.body;

    console.log(`\n- - - - - [POST /gamedata] [START] Received save request from user '${req.user.id}' for game '${gameIdentifier}'. - - - - -`);
    console.log(`[POST /gamedata] [DATA] Raw payload:`, JSON.stringify(req.body, null, 2));

    if (!stage) {
        return res.status(400).json({ msg: 'Stage identifier is required.' });
    }
    const stageStr = String(stage);

    try {
        // 1. READ: Fetch the full user document.
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // 2. MODIFY: Get or create the progress object and update it using Mongoose's Map methods.
        if (!user.gameData.has(gameIdentifier)) {
            console.log(`[POST /gamedata] [STATE] First time save for this game. Initializing new GameProgress.`);
            user.gameData.set(gameIdentifier, {
                completedLevels: new Map(),
                highScores: new Map(),
                badges: new Map(),
                xp: new Map(),
                certificates: new Map()
            });
        }
        const progress = user.gameData.get(gameIdentifier);
        console.log(`[POST /gamedata] [STATE BEFORE]`, JSON.stringify(progress.toObject(), null, 2));

        if (status === 2) { // 2 = 'completed'
            progress.completedLevels.set(stageStr, true);
        }
        if (score !== undefined && (score > (progress.highScores.get(stageStr) || 0))) {
            progress.highScores.set(stageStr, score);
        }
        if (badge !== undefined && (String(badge) > (progress.badges.get(stageStr) || "0"))) {
            progress.badges.set(stageStr, String(badge));
        }
        if (xp !== undefined) {
            const existingXp = progress.xp.get(stageStr) || 0;
            progress.xp.set(stageStr, existingXp + xp);
        }
        if (certificate) {
            progress.certificates.set(stageStr, true);
        }

        console.log(`[POST /gamedata] [STATE AFTER MODIFICATION]`, JSON.stringify(progress.toObject(), null, 2));

        // 3. SAVE: Let Mongoose handle the update.
        await user.save();
        
        console.log(`[POST /gamedata] [DB SUCCESS] User document saved successfully.`);
        res.status(200).json({ msg: 'Progress updated.' });

    } catch (err) {
        console.error(`[POST /gamedata] [CRITICAL ERROR] for game '${gameIdentifier}':`, err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// --- (The rest of your userController.js file remains unchanged) ---
exports.getAllGameData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(Object.fromEntries(user.gameData));
    } catch (err) {
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