const School = require('../models/School');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

// --- School Management ---

exports.createSchool = async (req, res) => {
    try {
        // --- UPDATED: Accept capacity from body ---
        const { name, capacity } = req.body;
        if (!name) return res.status(400).json({ msg: 'School name is required.' });
        if (await School.findOne({ name })) return res.status(400).json({ msg: 'School with this name already exists.' });

        const school = new School({ name, capacity });
        await school.save();
        res.status(201).json(school);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getSchools = async (req, res) => {
    try {
        const schools = await School.find({});
        res.json(schools);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateSchool = async (req, res) => {
    try {
        // --- UPDATED: Accept capacity from body ---
        const { name, capacity } = req.body;
        const school = await School.findById(req.params.schoolId);

        if (!school) {
            return res.status(404).json({ msg: 'School not found.' });
        }

        school.name = name || school.name;
        school.capacity = capacity || school.capacity;
        const updatedSchool = await school.save();
        res.json(updatedSchool);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.deleteSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.schoolId);
        if (!school) return res.status(404).json({ msg: 'School not found.' });

        await School.findByIdAndDelete(req.params.schoolId);

        res.json({ msg: 'School removed successfully.' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};


// --- School Admin Management ---

exports.createSchoolAdmin = async (req, res) => {
    // --- UPDATED: Remove password, rely on email invitation ---
    const { email, schoolId, username } = req.body;
    try {
        if (await User.findOne({ email })) return res.status(400).json({ msg: 'Email already in use.' });
        
        const school = await School.findById(schoolId);
        if (!school) return res.status(404).json({ msg: 'School not found.' });

        const admin = new User({
            email,
            school: schoolId,
            username,
            role: 'schooladmin',
            isVerified: true,
            isApproved: true
        });

        // --- NEW: Generate reset token and send invitation email ---
        const resetToken = admin.getResetPasswordToken();
        await admin.save({ validateBeforeSave: false }); // Save user with the token

        const resetUrl = `https://xpark.onrender.com/reset-password/${resetToken}`;

        await sendEmail({
            to: admin.email,
            subject: 'You have been invited as a School Administrator',
            html: `
                <p>Hello ${admin.username},</p>
                <p>You have been invited to become a school administrator for ${school.name} on the XPARK platform.</p>
                <p>Please click the link below to set your password and access your account:</p>
                <a href="${resetUrl}">Set Your Password</a>
                <p>This link will expire in 10 minutes.</p>
            `
        });

        res.status(201).json({ msg: 'Admin account created and invitation email sent.'});
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getSchoolAdmins = async (req, res) => {
    try {
        // --- UPDATED: Populate school capacity along with the name ---
        const admins = await User.find({ role: 'schooladmin' }).populate('school', 'name capacity').select('-password');
        res.json(admins);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.deleteSchoolAdmin = async (req, res) => {
    try {
        await User.findOneAndDelete({ _id: req.params.adminId, role: 'schooladmin' });
        res.json({ msg: 'School admin removed successfully.' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};