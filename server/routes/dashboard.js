const express = require('express');
const router = express.Router();
const { getSchoolAdminDashboardStats, getSchoolGameProgress } = require('../controllers/dashboardController');
const { protect, isSchoolAdmin } = require('../middleware/authMiddleware');

// This route is protected and only for school admins
router.get('/school-admin', protect, isSchoolAdmin, getSchoolAdminDashboardStats);

// --- NEW ROUTE ---
router.get('/school-game-progress', protect, isSchoolAdmin, getSchoolGameProgress);


module.exports = router;