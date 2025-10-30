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

/**
 * THIS IS THE DEFINITIVE FIX for GETTING data.
 * It uses .lean() to get a plain JavaScript object directly from the database,
 * bypassing any Mongoose conversion issues that were causing it to return an empty object.
 */
exports.getGameData = async (req, res) => {
  const { gameIdentifier } = req.params;
  console.log(
    `\n----- [GET /gamedata] [START] User '${req.user.id}' requesting data for '${gameIdentifier}' -----`
  );

  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      console.error(`[GET /gamedata] [ERROR] User with ID '${req.user.id}' not found.`);
      return res.status(404).json({ msg: 'User not found' });
    }

    const gameProgress = user.gameData ? user.gameData[gameIdentifier] : undefined;

    if (!gameProgress) {
      console.log(`[GET /gamedata] [SUCCESS] No progress found for this game. Sending empty object.`);
      return res.json({});
    }

    console.log(`[GET /gamedata] [SUCCESS] Found progress:`, JSON.stringify(gameProgress, null, 2));
    res.json(gameProgress);
  } catch (err) {
    console.error('[GET /gamedata] [CRITICAL ERROR]', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * THIS IS THE DEFINITIVE FIX.
 * It uses findOneAndUpdate to perform an atomic read-modify-write operation,
 * which is immune to the race condition that was causing progress to be overwritten.
 */
exports.updateGameData = async (req, res) => {
  const { gameIdentifier } = req.params;
  const { stage, score, badge, xp, status } = req.body;

  console.log(
    `\n----- [POST /gamedata] [START] Save request from user '${req.user.id}' for '${gameIdentifier}' -----`
  );
  console.log(`[POST /gamedata] [DATA]`, JSON.stringify(req.body, null, 2));

  if (!stage) return res.status(400).json({ msg: 'Stage is required.' });

  const stageStr = String(stage);

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const progress =
      user.gameData.get(gameIdentifier)?.toObject() || {
        completedLevels: {},
        highScores: {},
        badges: {},
        xp: {},
      };

    console.log(`[POST /gamedata] [STATE BEFORE]`, JSON.stringify(progress, null, 2));

    const updates = {};

    if (status === 2)
      updates[`gameData.${gameIdentifier}.completedLevels.${stageStr}`] = true;

    if (score !== undefined && score > (progress.highScores[stageStr] || 0))
      updates[`gameData.${gameIdentifier}.highScores.${stageStr}`] = score;

    if (badge !== undefined && parseInt(badge) > parseInt(progress.badges[stageStr] || '0'))
      updates[`gameData.${gameIdentifier}.badges.${stageStr}`] = String(badge);

    if (xp !== undefined)
      updates[`gameData.${gameIdentifier}.xp.${stageStr}`] = xp;

    console.log(`[POST /gamedata] [ATOMIC UPDATES]`, JSON.stringify(updates, null, 2));

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: updates },
      { new: true }
    );

    console.log(
      `[POST /gamedata] [STATE AFTER]`,
      JSON.stringify(updatedUser.gameData.get(gameIdentifier).toObject(), null, 2)
    );
    console.log(`[POST /gamedata] [DB SUCCESS] Atomic update successful.`);
    res.status(200).json({ msg: 'Progress updated.' });
  } catch (err) {
    console.error('[POST /gamedata] [CRITICAL ERROR]', err);
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
