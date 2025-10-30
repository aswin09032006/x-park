const User = require('../models/User');
const PreRegisteredStudent = require('../models/PreRegisteredStudent');
const School = require('../models/School'); // <-- IMPORT SCHOOL MODEL
const fs = require('fs');
const csv = require('csv-parser');
const { sendEmail } = require('../services/emailService');
const Game = require('../models/Game'); // <-- IMPORT GAME MODEL

const sendInvitationEmail = async (student, unhashedToken, schoolName, customSubject, customBody, isReminder = false) => {
    const registrationLink = `https://xpark.onrender.com/register/invite/${unhashedToken}`;

    // --- Define Default Templates ---
    const defaultSubject = isReminder ? `Reminder: Your Invitation to Join XPARK` : `Your Invitation to Join XPARK`;
    const defaultBody = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #2c3e50;">Dear {{studentFirstName}},</h2>
            <p>You have been invited by your administrator at <strong>{{schoolName}}</strong> to join the XPARK platform.</p>
            <p>To activate your account and set your password, please click the button below:</p>
            <a href="{{registrationLink}}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Activate Account</a>
            <p style="margin-top: 20px; font-size: 12px; color: #777;">
                If the button above does not work, please copy and paste the following link into your web browser:<br>
                <a href="{{registrationLink}}">{{registrationLink}}</a>
            </p>
            <p style="font-size: 12px; color: #777;">Please note: This link will expire in 14 days.</p>
            <p style="margin-top: 20px;">We look forward to welcoming you to XPARK.</p>
            <p style="margin-top: 10px;">Best regards,<br><strong>The XPARK Team</strong></p>
        </div>
    `;

    // --- Use provided templates or fall back to defaults ---
    let finalSubject = customSubject || defaultSubject;
    let finalBody = customBody || defaultBody;

    // --- Replace all placeholders ---
    finalSubject = finalSubject.replace(/{{studentFirstName}}/g, student.firstName);
    finalSubject = finalSubject.replace(/{{schoolName}}/g, schoolName);

    finalBody = finalBody.replace(/{{studentFirstName}}/g, student.firstName);
    finalBody = finalBody.replace(/{{schoolName}}/g, schoolName);
    finalBody = finalBody.replace(/{{registrationLink}}/g, registrationLink);
    
    const emailOptions = {
        to: student.email,
        subject: finalSubject,
        html: finalBody
    };

    await sendEmail(emailOptions);
};

// --- NEW: School Analytics Controller ---
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
        const remainingSeats = school.capacity - totalStudents;

        res.json({
            capacity: school.capacity,
            registered: registeredCount,
            pending: pendingCount,
            remaining: remainingSeats < 0 ? 0 : remainingSeats
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// --- NEW: Resend Reminders Controller ---
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
            // Call with null for subject/body to use the default reminder template
            await sendInvitationEmail(student, unhashedToken, school.name, null, null, true); 
        }

        res.status(200).json({ msg: `Successfully sent reminders to ${pendingStudents.length} student(s).` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};


exports.bulkAddStudents = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded.' });
    }
    const school = await School.findById(req.user.school).select('name');
    if (!school) return res.status(404).json({ msg: 'Admin\'s school not found.' });

    // --- Get email subject and body from the request ---
    const { emailSubject, emailBody } = req.body;
    const studentsFromCsv = [];
    const failedRows = [];

    fs.createReadStream(req.file.path)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
        .on('data', (row) => {
            studentsFromCsv.push({
                email: row.email || '',
                firstName: row.firstname || '',
                lastName: row.lastname || '',
                phoneNumber: row.phonenumber || '',
                yearGroup: row.yeargroup || '',
            });
        })
        .on('end', async () => {
            // ... (rest of the validation logic remains the same)
            fs.unlinkSync(req.file.path);

            if (studentsFromCsv.length === 0) { return res.status(400).json({ msg: 'CSV file was empty.' }); }
            
            const validStudentsToProcess = [];
            const seenEmails = new Set();
            const seenUsernames = new Set();

            for (const row of studentsFromCsv) {
                const email = row.email ? row.email.toLowerCase().trim() : '';
                const firstName = row.firstName ? row.firstName.trim() : '';
                const lastName = row.lastName ? row.lastName.trim() : '';
                
                const username = `${firstName} ${lastName}`.trim();

                if (!email || !firstName || !lastName) {
                    failedRows.push({ ...row, reason: 'Missing required fields' });
                    continue;
                }
                if (seenEmails.has(email)) {
                    failedRows.push({ ...row, reason: 'Duplicate email within CSV file' });
                    continue;
                }
                seenEmails.add(email);
                
                if (username) {
                    if (seenUsernames.has(username)) {
                        failedRows.push({ ...row, reason: 'Duplicate name results in duplicate username within CSV file' });
                        continue;
                    }
                    seenUsernames.add(username);
                }
                
                validStudentsToProcess.push({ ...row, username, school: req.user.school });
            }
            
            if (validStudentsToProcess.length === 0) {
                 return res.status(400).json({ msg: 'Upload failed. No valid rows found to process.', details: { failedRows } });
            }

            const allEmails = validStudentsToProcess.map(s => s.email);
            const allUsernames = validStudentsToProcess.map(s => s.username);
            const existingUsers = await User.find({ $or: [{ email: { $in: allEmails } }, { username: { $in: allUsernames } }] }).select('email username');
            const existingPreReg = await PreRegisteredStudent.find({ $or: [{ email: { $in: allEmails } }, { username: { $in: allUsernames } }] }).select('email username');
            const existingEmails = new Set([...existingUsers.map(u => u.email), ...existingPreReg.map(p => p.email)]);
            const existingUsernames = new Set([...existingUsers.map(u => u.username), ...existingPreReg.map(p => p.username)]);
            
            const finalStudentsData = validStudentsToProcess.filter(student => {
                if (existingEmails.has(student.email)) {
                    failedRows.push({ ...student, reason: 'Email already exists in the system' });
                    return false;
                }
                if (student.username && existingUsernames.has(student.username)) {
                    failedRows.push({ ...student, reason: 'Username (from name) already exists in the system' });
                    return false;
                }
                return true;
            });

            if (finalStudentsData.length === 0) {
                return res.status(400).json({ msg: 'Upload failed. All valid students from the CSV already exist.', details: { failedRows } });
            }
            
            try {
                const studentsWithTokens = [];
                const emailQueue = [];
                for (const studentData of finalStudentsData) {
                    const student = new PreRegisteredStudent(studentData);
                    const unhashedToken = student.getRegistrationToken();
                    studentsWithTokens.push(student);
                    emailQueue.push({ student, unhashedToken });
                }
                
                const insertedDocs = await PreRegisteredStudent.insertMany(studentsWithTokens);

                for (const emailJob of emailQueue) {
                    // --- Pass the custom subject and body to the email service ---
                    await sendInvitationEmail(emailJob.student, emailJob.unhashedToken, school.name, emailSubject, emailBody);
                }

                const successCount = insertedDocs.length;
                res.status(200).json({
                    msg: `Upload complete. ${successCount} invitation(s) sent, ${failedRows.length} row(s) failed.`,
                    details: { successCount: successCount, failedRows: failedRows }
                });

            } catch (dbError) {
                console.error("Bulk Add DB Error:", dbError);
                res.status(500).json({ msg: 'A database error occurred during the final import.', details: { failedRows } });
            }
        });
};

exports.inviteStudent = async (req, res) => {
    // --- Get email subject and body from the request ---
    const { email, firstName, lastName, phoneNumber, yearGroup, emailSubject, emailBody } = req.body;
    try {
        const school = await School.findById(req.user.school).select('name');
        if (!school) return res.status(404).json({ msg: 'Admin\'s school not found.' });

        if (await User.findOne({ email })) {
            return res.status(400).json({ msg: 'A registered user with this email already exists.' });
        }
        
        const username = `${firstName} ${lastName}`.trim();
        if (await User.findOne({ username }) || await PreRegisteredStudent.findOne({ username })) {
            return res.status(400).json({ msg: 'A student with this name already exists, resulting in a duplicate username.' });
        }

        const existingInvite = await PreRegisteredStudent.findOne({ email });
        if (existingInvite) {
             const unhashedToken = existingInvite.getRegistrationToken();
             await existingInvite.save();
             // Resending an invite from this flow will now use the new template provided by the admin
             await sendInvitationEmail(existingInvite, unhashedToken, school.name, emailSubject, emailBody, true);
             return res.status(200).json({ msg: 'This email was already invited. A new reminder with your content has been sent.' });
        }
        
        const newStudent = new PreRegisteredStudent({
            email, firstName, lastName, username,
            phoneNumber, yearGroup,
            school: req.user.school
        });

        const unhashedToken = newStudent.getRegistrationToken();
        await newStudent.save();

        // --- Pass the custom subject and body to the email service ---
        await sendInvitationEmail(newStudent, unhashedToken, school.name, emailSubject, emailBody);

        res.status(201).json({ msg: 'Invitation sent successfully.', student: newStudent });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getSchoolStudents = async (req, res) => {
    try {
        const adminUser = await User.findById(req.user.id);
        if (!adminUser || !adminUser.school) {
            return res.status(404).json({ msg: 'Admin user or school not found.' });
        }
        const students = await User.find({ school: adminUser.school, role: 'student' }).select('-password');
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getPendingStudents = async (req, res) => {
    try {
        const pending = await PreRegisteredStudent.find({
            school: req.user.school, status: 'pending'
        }).select('_id email createdAt username firstName lastName'); // <-- Include names
        res.json(pending);
    } catch (err)
    {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.approveStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const adminUser = await User.findById(req.user.id);
        const student = await User.findOne({ _id: studentId, school: adminUser.school });
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

exports.removeStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const adminUser = await User.findById(req.user.id);
        const student = await User.findOne({ _id: studentId, school: adminUser.school });
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

exports.removePendingStudent = async (req, res) => {
    try {
        const { inviteId } = req.params;
        const adminSchool = req.user.school;
        const pendingStudent = await PreRegisteredStudent.findOne({ _id: inviteId, school: adminSchool });
        if (!pendingStudent) {
            return res.status(404).json({ msg: 'Pending invitation not found in your school.' });
        }
        await PreRegisteredStudent.findByIdAndDelete(inviteId);
        res.json({ msg: 'Pending invitation removed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};
// --- Controller for fetching single student's game data ---
exports.getStudentGameData = async (req, res) => {
    try {
        const { studentId } = req.params;
        const adminSchoolId = req.user.school.toString();

        const student = await User.findById(studentId).select('gameData school');
        
        if (!student || !student.school || student.school.toString() !== adminSchoolId) {
            return res.status(404).json({ msg: 'Student not found in your school.' });
        }

        if (!student.gameData || student.gameData.size === 0) {
            return res.json([]);
        }

        // --- THIS IS THE FIX ---
        // 1. Fetch all games to create a comprehensive lookup map.
        const allGames = await Game.find({}).select('title');
        const gameMap = new Map();
        allGames.forEach(game => {
            // Map by ObjectId
            gameMap.set(game._id.toString(), game.title);
            // Manually map any known string identifiers
            if (game.title === 'Data Forge') {
                gameMap.set('data-forge', game.title);
            }
        });

        const results = [];
        for (const [gameId, progress] of student.gameData.entries()) {
            const badges = progress.badges ? progress.badges.size : 0;
            let score = 0;
            if (progress.highScores) {
                score = Array.from(progress.highScores.values()).reduce((sum, s) => sum + s, 0);
            }

            results.push({
                // 2. Use the new, robust map for the lookup.
                gameTitle: gameMap.get(gameId) || 'Unknown Game',
                gamesPlayed: progress.completedLevels ? progress.completedLevels.size : 0,
                badges: badges,
                certificates: Math.floor(badges / 3),
                score: score,
            });
        }
        
        res.json(results);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};