const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin } = require('../middleware/authMiddleware');
const {
    createSchool, getSchools, updateSchool, deleteSchool,
    createSchoolAdmin, getSchoolAdmins, deleteSchoolAdmin
} = require('../controllers/superadminController');

// All routes here are protected and for Super Admins only
router.use(protect, isSuperAdmin);

// School CRUD routes
router.route('/schools')
    .post(createSchool)
    .get(getSchools);

router.route('/schools/:schoolId')
    .put(updateSchool)
    .delete(deleteSchool);

// School Admin CRUD routes
router.route('/admins')
    .post(createSchoolAdmin)
    .get(getSchoolAdmins);
    
router.route('/admins/:adminId')
    .delete(deleteSchoolAdmin);

module.exports = router;