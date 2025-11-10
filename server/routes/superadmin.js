// --- /backend/routes/superadmin.js ---
const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin } = require('../middleware/authMiddleware');
const {
    createSchool, getSchools, updateSchool, deleteSchool,
    createSchoolAdmin, getSchoolAdmins, deleteSchoolAdmin,
    resendAdminInvitation // <-- Import new controller
} = require('../controllers/superadminController');

router.use(protect, isSuperAdmin);

router.route('/schools').post(createSchool).get(getSchools);
router.route('/schools/:schoolId').put(updateSchool).delete(deleteSchool);

router.route('/admins').post(createSchoolAdmin).get(getSchoolAdmins);
router.route('/admins/:adminId').delete(deleteSchoolAdmin);
// --- THIS IS THE FIX: Add the new route ---
router.post('/admins/:adminId/resend-invite', resendAdminInvitation);

module.exports = router;