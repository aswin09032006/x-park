const express = require('express');
const router = express.Router();
const { getSchools, getSchoolBySlug, getSchoolByPreRegisteredEmail } = require('../controllers/schoolController');

router.get('/', getSchools);
router.get('/slug/:slug', getSchoolBySlug);
router.get('/email-lookup', getSchoolByPreRegisteredEmail);

module.exports = router;