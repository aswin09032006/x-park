const express = require('express');
const router = express.Router();
const { 
    getMe, updateMe, getSavedGames, saveGame, unsaveGame, 
    getGameData, updateGameData, getAllGameData,
    updateAvatarPreference, removeAvatarPreference,
    getPlayedGames, addPlayedGame, completeOnboarding
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validate, updateUserRules } = require('../middleware/validator');

router.get('/me', protect, getMe);
router.put('/me', protect, updateUserRules(), validate, updateMe);
router.post('/me/complete-onboarding', protect, completeOnboarding);
router.get('/me/saved-games', protect, getSavedGames);
router.post('/me/saved-games', protect, saveGame);
router.delete('/me/saved-games/:gameId', protect, unsaveGame);
router.get('/me/played-games', protect, getPlayedGames);
router.post('/me/played-games', protect, addPlayedGame);
router.get('/me/gamedata/:gameIdentifier', protect, getGameData);
router.post('/me/gamedata/:gameIdentifier', protect, updateGameData);
router.get('/me/gamedata', protect, getAllGameData);
router.put('/me/avatar', protect, updateAvatarPreference);
router.delete('/me/avatar', protect, removeAvatarPreference);

module.exports = router;