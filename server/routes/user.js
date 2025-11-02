const express = require('express');
const router = express.Router();
// --- Import all the functions that are exported from the controller ---
const { 
    getMe, 
    updateMe, 
    getSavedGames, 
    saveGame, 
    unsaveGame, 
    getGameData, 
    updateGameData, 
    getAllGameData,
    updateAvatarPreference,
    removeAvatarPreference,
    getPlayedGames,     // <-- THIS IS THE FIX
    addPlayedGame       // <-- THIS IS THE FIX
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validate, updateUserRules } = require('../middleware/validator');

// Get current user's data
router.get('/me', protect, getMe);

// Update current user's data with validation
router.put('/me', protect, updateUserRules(), validate, updateMe);

// Saved Games routes
router.get('/me/saved-games', protect, getSavedGames);
router.post('/me/saved-games', protect, saveGame);
router.delete('/me/saved-games/:gameId', protect, unsaveGame);

// --- THIS IS THE FIX: New routes for managing played games ---
router.get('/me/played-games', protect, getPlayedGames);
router.post('/me/played-games', protect, addPlayedGame);

// Game Progress routes
router.get('/me/gamedata/:gameIdentifier', protect, getGameData);
router.post('/me/gamedata/:gameIdentifier', protect, updateGameData);
router.get('/me/gamedata', protect, getAllGameData);

// --- Add the missing routes for avatar preference management ---
router.put('/me/avatar', protect, updateAvatarPreference);
router.delete('/me/avatar', protect, removeAvatarPreference);


module.exports = router;