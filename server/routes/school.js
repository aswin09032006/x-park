const express = require('express');
const router = express.Router();
const { getSchools, getSchoolBySlug, getSchoolByPreRegisteredEmail } = require('../controllers/schoolController');

router.get('/', getSchools);
router.get('/slug/:slug', getSchoolBySlug);

// This route replaces the old domain lookup
router.get('/email-lookup', getSchoolByPreRegisteredEmail);

module.exports = router;