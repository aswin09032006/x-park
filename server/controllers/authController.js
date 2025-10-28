const User = require('../models/User');
const School = require('../models/School');
const PreRegisteredStudent = require('../models/PreRegisteredStudent');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../services/emailService');

const gen = u => ({
    accessToken: jwt.sign({ id: u._id, role: u.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }),
    refreshToken: jwt.sign({ id: u._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }),
    role: u.role
});

exports.verifyInviteToken = async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const preReg = await PreRegisteredStudent.findOne({
            registrationToken: hashedToken,
            registrationTokenExpires: { $gt: Date.now() }
        });

        if (!preReg) {
            return res.status(400).json({ msg: 'Invitation link is invalid or has expired.' });
        }

        // --- UPDATED: Return firstName and lastName ---
        res.json({ 
            email: preReg.email, 
            firstName: preReg.firstName,
            lastName: preReg.lastName,
            username: preReg.username,
            phoneNumber: preReg.phoneNumber
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.completeInvitedRegistration = async (req, res) => {
    // --- UPDATED: Remove username from request body ---
    const { password, phoneNumber } = req.body;
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const preReg = await PreRegisteredStudent.findOne({
            registrationToken: hashedToken,
            registrationTokenExpires: { $gt: Date.now() }
        });

        if (!preReg) {
            return res.status(400).json({ msg: 'Invitation link is invalid or has expired.' });
        }

        // --- THIS IS THE FIX: Logic simplified as username is always pre-set ---
        const finalUsername = preReg.username;

        await User.create({
            email: preReg.email,
            school: preReg.school,
            firstName: preReg.firstName,
            lastName: preReg.lastName,
            username: finalUsername,
            phoneNumber: phoneNumber || preReg.phoneNumber,
            yearGroup: preReg.yearGroup,
            password: password,
            isVerified: true,
            isApproved: true,
        });

        await PreRegisteredStudent.deleteOne({ _id: preReg._id });

        res.status(201).json({ msg: 'Registration successful! You can now log in.' });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'A user with this email or username already exists.' });
        }
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// --- PUBLIC REGISTRATION FLOW ---
exports.registerStart = async (req, res) => {
    try {
        if (await User.findOne({ email: req.body.email, isVerified: true })) {
            return res.status(400).json({ msg: 'An account with this email already exists.' });
        }
        
        const preRegistered = await PreRegisteredStudent.findOne({
            email: req.body.email.toLowerCase(),
            status: 'pending'
        }).populate('school');
        
        if (!preRegistered) {
            return res.status(403).json({ msg: 'This email has not been pre-registered. Please contact your school administrator for an invitation.' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await User.updateOne({ email: req.body.email }, { $set: { school: preRegistered.school._id, verificationCode: crypto.createHash('sha256').update(code).digest('hex'), verificationCodeExpires: Date.now() + 600000, isVerified: false } }, { upsert: true });
        
        await sendEmail({ to: req.body.email, subject: 'Verification Code', text: `Your code is: ${code}` });
        res.status(200).json({ msg: 'Verification code sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.registerVerify = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email, verificationCode: crypto.createHash('sha256').update(req.body.code).digest('hex'), verificationCodeExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ msg: 'Invalid or expired code.' });
        res.status(200).json({ msg: 'Code verified.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.registerComplete = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email, verificationCode: crypto.createHash('sha256').update(req.body.code).digest('hex') });
        if (!user) return res.status(400).json({ msg: 'Verification has expired.' });
        if (await User.findOne({ username: req.body.username })) return res.status(400).json({ msg: 'Username taken.' });
        
        user.username = req.body.username; 
        user.password = req.body.password; 
        user.isVerified = true; 
        user.verificationCode = undefined; 
        user.verificationCodeExpires = undefined;
        await user.save();

        await PreRegisteredStudent.deleteOne({ email: req.body.email.toLowerCase(), school: user.school });

        res.status(201).json({ msg: 'Registration complete! Your account is pending approval from your school administrator.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// --- LOGIN & OTHER AUTH ---
exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email }).select('+password');
        if (!user || !(await user.matchPassword(req.body.password))) return res.status(400).json({ msg: 'Invalid credentials' });
        if (!user.isVerified) return res.status(401).json({ msg: 'Please verify your email.' });
        if (user.role === 'student' && !user.isApproved) {
            return res.status(403).json({ msg: 'Your account has not been approved by an administrator yet.' });
        }
        res.json(gen(user));
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            const token = user.getResetPasswordToken(); await user.save({ validateBeforeSave: false });
            await sendEmail({ to: user.email, subject: 'Password Reset', text: `Reset here: https://x-park.vercel.app/reset-password/${token}` });
        }
        res.status(200).json({ msg: 'If a user with that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({ passwordResetToken: crypto.createHash('sha256').update(req.params.resetToken).digest('hex'), passwordResetExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });
        user.password = req.body.password; user.passwordResetToken = undefined; user.passwordResetExpires = undefined;
        await user.save();
        res.status(200).json({ msg: 'Password reset successful.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ msg: 'Refresh token required' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ msg: 'User not found' });
        
        // Generate a new access token
        const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN });
        res.json({ accessToken });
    } catch (err) {
        console.error(err);
        return res.status(403).json({ msg: 'Invalid or expired refresh token' });
    }
};

exports.publicRegisterStart = async (req, res) => {
    try {
        const { email } = req.body;
        if (await User.findOne({ email, isVerified: true })) {
            return res.status(400).json({ msg: 'An active account with this email already exists.' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        
        // Use `updateOne` with `upsert` to create a temporary user entry if one doesn't exist,
        // or update the code for an existing unverified user.
        await User.updateOne(
            { email: email.toLowerCase() },
            { $set: { 
                verificationCode: hashedCode, 
                verificationCodeExpires: Date.now() + 10 * 60 * 1000, // 10 minute expiry
                isVerified: false 
            }},
            { upsert: true }
        );
        
        await sendEmail({ to: email, subject: 'Your XPARK Verification Code', text: `Your verification code is: ${code}` });
        res.status(200).json({ msg: 'Verification code sent to your email.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error while sending code.' });
    }
};

// STEP 2: User submits the code to verify it
exports.publicRegisterVerify = async (req, res) => {
    try {
        const { email, code } = req.body;
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

        const user = await User.findOne({ 
            email, 
            verificationCode: hashedCode, 
            verificationCodeExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired verification code.' });
        }

        res.status(200).json({ msg: 'Code verified successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error during verification.' });
    }
};

// STEP 3: User submits final details (name, username, password) to complete registration
exports.publicRegisterComplete = async (req, res) => {
    try {
        // --- UPDATED: Accept firstName, lastName ---
        const { email, code, firstName, lastName, username, password } = req.body;
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

        const user = await User.findOne({
            email,
            verificationCode: hashedCode,
            verificationCodeExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ msg: 'Verification has expired or is invalid. Please start over.' });
        }
        
        // --- UPDATED: Username logic ---
        let finalUsername = username || `${firstName} ${lastName}`.trim();

        const usernameExists = await User.findOne({ username: finalUsername, _id: { $ne: user._id } });
        if (usernameExists) {
            return res.status(400).json({ msg: 'This username is already taken. Please choose another one.' });
        }

        user.firstName = firstName;
        user.lastName = lastName;
        user.username = finalUsername;
        user.password = password;
        user.isVerified = true;
        user.isApproved = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        
        await user.save();

        res.status(201).json({ msg: 'Registration complete! You can now log in.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error during registration completion.' });
    }
};


