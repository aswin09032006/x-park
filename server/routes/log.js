const express = require('express');
const router = express.Router();
const { logFromFrontend } = require('../controllers/logController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, logFromFrontend);

module.exports = router;