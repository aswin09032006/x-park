const express = require('express');
const router = express.Router();
const { getSchoolAdminDashboardStats, getSchoolGameProgress } = require('../controllers/dashboardController');
const { protect, isSchoolAdmin } = require('../middleware/authMiddleware');

router.get('/school-admin', protect, isSchoolAdmin, getSchoolAdminDashboardStats);
router.get('/school-game-progress', protect, isSchoolAdmin, getSchoolGameProgress);

module.exports = router;