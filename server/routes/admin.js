const express = require('express');
const router = express.Router();
const { 
    getSchoolStudents, 
    approveStudent, 
    removeStudent, 
    bulkAddStudents,
    getPendingStudents,
    inviteStudent,
    removePendingStudent,
    getSchoolStats,
    resendReminders,
    getStudentGameData // <-- IMPORT NEW
} = require('../controllers/adminController');
const { protect, isSchoolAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.use(protect, isSchoolAdmin);

router.get('/school-stats', getSchoolStats);
router.post('/resend-reminders', resendReminders);

router.get('/students', getSchoolStudents);
router.post('/students/bulk-add', upload.single('studentFile'), bulkAddStudents);
router.patch('/students/:studentId/approve', approveStudent);
router.delete('/students/:studentId', removeStudent);

// --- NEW ROUTE for student details ---
router.get('/students/:studentId/gamedata', getStudentGameData);

router.get('/pending-students', getPendingStudents);
router.post('/invite-student', inviteStudent);
router.delete('/pending-students/:inviteId', removePendingStudent);

module.exports = router;