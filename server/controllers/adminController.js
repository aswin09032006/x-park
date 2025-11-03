const fs = require('fs');
const csv = require('csv-parser');
const User = require('../models/User');
const Game = require('../models/Game');
const School = require('../models/School');
const PreRegisteredStudent = require('../models/PreRegisteredStudent');
const { sendEmail } = require('../services/emailService');

// ============================================================
// Utility: Send invitation or reminder email
// ============================================================
const sendInvitationEmail = async (
    student,
    unhashedToken,
    schoolName,
    customSubject,
    customBody,
    isReminder = false
) => {
    const registrationLink = `${process.env.FRONTEND_URL_EMAIL}/register/invite/${unhashedToken}`;

    // --- Default templates ---
    const defaultSubject = isReminder
        ? `Reminder: Your Invitation to Join XPARK`
        : `Your Invitation to Join XPARK`;

    const defaultBody = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header with Banner -->
        <div style="background-color: #1a1a1a; text-align: center;">
            <img src="https://res.cloudinary.com/dcjyydmzs/image/upload/v1762106928/WhatsApp_Image_2025-11-02_at_23.25.36_ff066a38_hvxjnb.jpg" alt="XPARK Banner" style="max-width: 100%; height: auto; display: block;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Dear {{studentFirstName}},</h2>
            
            <p style="color: #333; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px;">
                You have been invited by your school administrator at <strong>{{schoolName}}</strong> to join the XPARK platform.
            </p>
            
            <p style="color: #333; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px;">
                XPARK Games helps you explore the world of digital careers through fun, interactive games and discover the future that fits you best.
            </p>
            
            <p style="color: #333; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">
                To activate your account and set your password, please click the button below:
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 0 0 24px 0;">
                <a href="{{registrationLink}}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Activate Account</a>
            </div>
            
            <!-- Alternative Link -->
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 16px; margin: 0 0 16px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
                    If the button above doesn't work, copy and paste this link into your web browser:
                </p>
                <p style="margin: 0; font-size: 13px; word-break: break-all;">
                    <a href="{{registrationLink}}" style="color: #007bff; text-decoration: underline;">{{registrationLink}}</a>
                </p>
            </div>
            
            <!-- Expiry Notice -->
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 0 0 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>Important:</strong> This activation link will expire in 14 days.
                </p>
            </div>
            
            <p style="color: #333; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px;">
                We look forward to welcoming you to XPARK!
            </p>
            
            <p style="color: #333; line-height: 1.6; margin: 0; font-size: 16px;">
                Best regards,<br>
                <strong>The XPARK Games Team</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center; line-height: 1.5;">
                This email was sent by XPARK Games. If you believe you received this email in error, please contact your school administrator.
            </p>
        </div>
    </div>
</div>
    `;

    // --- Merge templates with variables ---
    let finalSubject = (customSubject || defaultSubject)
        .replace(/{{studentFirstName}}/g, student.firstName)
        .replace(/{{schoolName}}/g, schoolName);

    let finalBody = (customBody || defaultBody)
        .replace(/{{studentFirstName}}/g, student.firstName)
        .replace(/{{schoolName}}/g, schoolName)
        .replace(/{{registrationLink}}/g, registrationLink);

    const emailOptions = {
        to: student.email,
        subject: finalSubject,
        html: finalBody,
    };

    await sendEmail(emailOptions);
};

// ============================================================
// @desc    Get school statistics (capacity, registered, pending)
// @route   GET /api/dashboard/school-stats
// @access  Private (School Admin)
// ============================================================
exports.getSchoolStats = async (req, res) => {
    try {
        const schoolId = req.user.school;
        const school = await School.findById(schoolId).select('capacity');
        if (!school) {
            return res.status(404).json({ msg: 'School not found.' });
        }

        const registeredCount = await User.countDocuments({ school: schoolId, role: 'student' });
        const pendingCount = await PreRegisteredStudent.countDocuments({ school: schoolId, status: 'pending' });

        const totalStudents = registeredCount + pendingCount;
        const remainingSeats = Math.max(school.capacity - totalStudents, 0);

        res.json({
            capacity: school.capacity,
            registered: registeredCount,
            pending: pendingCount,
            remaining: remainingSeats,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ============================================================
// @desc    Resend all pending invitations
// @route   POST /api/students/reminders
// @access  Private (School Admin)
// ============================================================
exports.resendReminders = async (req, res) => {
    try {
        const schoolId = req.user.school;
        const school = await School.findById(schoolId).select('name');
        if (!school) return res.status(404).json({ msg: 'School not found.' });

        const pendingStudents = await PreRegisteredStudent.find({ school: schoolId, status: 'pending' });

        if (pendingStudents.length === 0) {
            return res.status(400).json({ msg: 'No pending students to remind.' });
        }

        for (const student of pendingStudents) {
            const unhashedToken = student.getRegistrationToken();
            await student.save();
            await sendInvitationEmail(student, unhashedToken, school.name, null, null, true);
        }

        res.status(200).json({ msg: `Successfully sent reminders to ${pendingStudents.length} student(s).` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ============================================================
// @desc    Bulk add students via CSV
// @route   POST /api/students/bulk
// @access  Private (School Admin)
// ============================================================
exports.bulkAddStudents = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded.' });
    }

    const school = await School.findById(req.user.school).select('name');
    if (!school) return res.status(404).json({ msg: "Admin's school not found." });

    const { emailSubject, emailBody } = req.body;
    const studentsFromCsv = [];
    const failedRows = [];

    fs.createReadStream(req.file.path)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
        .on('data', (row) => {
            // --- THIS IS THE FIX: Removed phoneNumber ---
            studentsFromCsv.push({
                email: row.email || '',
                firstName: row.firstname || '',
                lastName: row.lastname || '',
                yearGroup: row.yeargroup || '',
            });
        })
        .on('end', async () => {
            fs.unlinkSync(req.file.path);

            if (studentsFromCsv.length === 0) {
                return res.status(400).json({ msg: 'CSV file was empty.' });
            }

            const validStudents = [];
            const seenEmails = new Set();
            const seenUsernames = new Set();

            for (const row of studentsFromCsv) {
                const email = row.email.toLowerCase().trim();
                const firstName = row.firstName.trim();
                const lastName = row.lastName.trim();
                const username = `${firstName} ${lastName}`.trim();

                if (!email || !firstName || !lastName) {
                    failedRows.push({ ...row, reason: 'Missing required fields' });
                    continue;
                }

                if (seenEmails.has(email)) {
                    failedRows.push({ ...row, reason: 'Duplicate email in CSV' });
                    continue;
                }
                seenEmails.add(email);

                if (username && seenUsernames.has(username)) {
                    failedRows.push({ ...row, reason: 'Duplicate username in CSV' });
                    continue;
                }
                seenUsernames.add(username);

                validStudents.push({ ...row, username, school: req.user.school });
            }

            if (validStudents.length === 0) {
                return res.status(400).json({ msg: 'No valid rows to process.', details: { failedRows } });
            }

            // Check for existing users or preregistrations
            const emails = validStudents.map(s => s.email);
            const usernames = validStudents.map(s => s.username);
            const existingUsers = await User.find({ $or: [{ email: { $in: emails } }, { username: { $in: usernames } }] }).select('email username');
            const existingPreRegs = await PreRegisteredStudent.find({ $or: [{ email: { $in: emails } }, { username: { $in: usernames } }] }).select('email username');

            const existingEmails = new Set([...existingUsers.map(u => u.email), ...existingPreRegs.map(p => p.email)]);
            const existingUsernames = new Set([...existingUsers.map(u => u.username), ...existingPreRegs.map(p => p.username)]);

            const finalStudents = validStudents.filter(s => {
                if (existingEmails.has(s.email)) {
                    failedRows.push({ ...s, reason: 'Email already exists' });
                    return false;
                }
                if (existingUsernames.has(s.username)) {
                    failedRows.push({ ...s, reason: 'Username already exists' });
                    return false;
                }
                return true;
            });

            if (finalStudents.length === 0) {
                return res.status(400).json({ msg: 'All valid students already exist.', details: { failedRows } });
            }

            try {
                const studentsWithTokens = [];
                const emailQueue = [];

                for (const s of finalStudents) {
                    const student = new PreRegisteredStudent(s);
                    const token = student.getRegistrationToken();
                    studentsWithTokens.push(student);
                    emailQueue.push({ student, token });
                }

                const inserted = await PreRegisteredStudent.insertMany(studentsWithTokens);

                for (const { student, token } of emailQueue) {
                    await sendInvitationEmail(student, token, school.name, emailSubject, emailBody);
                }

                res.status(200).json({
                    msg: `Upload complete. ${inserted.length} invitations sent, ${failedRows.length} failed.`,
                    details: { successCount: inserted.length, failedRows },
                });
            } catch (err) {
                console.error('Bulk Add DB Error:', err);
                res.status(500).json({ msg: 'Database error during import.', details: { failedRows } });
            }
        });
};

// ============================================================
// @desc    Invite a single student
// @route   POST /api/students/invite
// @access  Private (School Admin)
// ============================================================
exports.inviteStudent = async (req, res) => {
    // --- THIS IS THE FIX: Removed phoneNumber ---
    const { email, firstName, lastName, yearGroup, emailSubject, emailBody } = req.body;

    try {
        const school = await School.findById(req.user.school).select('name');
        if (!school) return res.status(404).json({ msg: "Admin's school not found." });

        if (await User.findOne({ email })) {
            return res.status(400).json({ msg: 'A registered user with this email already exists.' });
        }

        const username = `${firstName} ${lastName}`.trim();
        if (await User.findOne({ username }) || await PreRegisteredStudent.findOne({ username })) {
            return res.status(400).json({ msg: 'A student with this name already exists (duplicate username).' });
        }

        const existingInvite = await PreRegisteredStudent.findOne({ email });
        if (existingInvite) {
            const token = existingInvite.getRegistrationToken();
            await existingInvite.save();
            await sendInvitationEmail(existingInvite, token, school.name, emailSubject, emailBody, true);
            return res.status(200).json({ msg: 'Existing invite resent with updated content.' });
        }

        const newStudent = new PreRegisteredStudent({
            email, firstName, lastName, username,
            yearGroup, school: req.user.school,
        });

        const token = newStudent.getRegistrationToken();
        await newStudent.save();
        await sendInvitationEmail(newStudent, token, school.name, emailSubject, emailBody);

        res.status(201).json({ msg: 'Invitation sent successfully.', student: newStudent });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ============================================================
// @desc    Get all registered students in admin’s school
// ============================================================
exports.getSchoolStudents = async (req, res) => {
    try {
        const admin = await User.findById(req.user.id);
        if (!admin || !admin.school) {
            return res.status(404).json({ msg: 'Admin user or school not found.' });
        }

        const students = await User.find({ school: admin.school, role: 'student' }).select('-password');
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ============================================================
// @desc    Get all pending students
// ============================================================
exports.getPendingStudents = async (req, res) => {
    try {
        const pending = await PreRegisteredStudent.find({
            school: req.user.school,
            status: 'pending',
        }).select('_id email createdAt username firstName lastName');

        res.json(pending);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ============================================================
// @desc    Approve a registered student
// ============================================================
exports.approveStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const admin = await User.findById(req.user.id);
        const student = await User.findOne({ _id: studentId, school: admin.school });

        if (!student) {
            return res.status(404).json({ msg: 'Student not found in your school.' });
        }

        student.isApproved = true;
        await student.save();
        res.json({ msg: 'Student approved successfully.', student });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ============================================================
// @desc    Remove a registered student
// ============================================================
exports.removeStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const admin = await User.findById(req.user.id);
        const student = await User.findOne({ _id: studentId, school: admin.school });

        if (!student) {
            return res.status(404).json({ msg: 'Student not found in your school.' });
        }

        await User.findByIdAndDelete(studentId);
        res.json({ msg: 'Student removed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ============================================================
// @desc    Remove a pending (invited) student
// ============================================================
exports.removePendingStudent = async (req, res) => {
    try {
        const { inviteId } = req.params;
        const school = req.user.school;
        const pending = await PreRegisteredStudent.findOne({ _id: inviteId, school });

        if (!pending) {
            return res.status(404).json({ msg: 'Pending invitation not found in your school.' });
        }

        await PreRegisteredStudent.findByIdAndDelete(inviteId);
        res.json({ msg: 'Pending invitation removed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ============================================================
// @desc    Get a student’s game data (for school admin view)
// ============================================================
exports.getStudentGameData = async (req, res) => {
    try {
        const { studentId } = req.params;
        const adminSchoolId = req.user.school.toString();

        const student = await User.findById(studentId).select('gameData school');
        if (!student || student.school.toString() !== adminSchoolId) {
            return res.status(404).json({ msg: 'Student not found in your school.' });
        }

        if (!student.gameData || student.gameData.size === 0) {
            return res.json([]);
        }

        const allGames = await Game.find({}).select('title');
        const gameMap = new Map();
        allGames.forEach(game => {
            gameMap.set(game._id.toString(), game.title);
            if (game.title === 'Data Forge') gameMap.set('data-forge', game.title);
            if (game.title === 'Network Shield') gameMap.set('cyber-security', game.title);
        });

        const results = [];
        for (const [gameId, progress] of student.gameData.entries()) {
            const badges = progress.badges ? progress.badges.size : 0;
            // --- THIS IS THE FIX: Sum actual certificates ---
            const certificates = progress.certificates ? progress.certificates.size : 0;
            const score = progress.highScores
                ? Array.from(progress.highScores.values()).reduce((a, b) => a + b, 0)
                : 0;

            results.push({
                gameTitle: gameMap.get(gameId) || 'Unknown Game',
                gamesPlayed: progress.completedLevels ? progress.completedLevels.size : 0,
                badges,
                certificates, // Use the correct value
                score,
            });
        }

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};