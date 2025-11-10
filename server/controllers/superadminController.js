// --- /backend/controllers/superadminController.js ---
const School = require('../models/School');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { backendLogger } = require('../config/logger');

exports.createSchool = async (req, res) => {
    const context = 'superadminController.createSchool';
    const { correlation_id } = req;
    try {
        // --- MODIFIED ---
        const { name, capacity, city, county } = req.body;
        if (!name) return res.status(400).json({ msg: 'School name is required.' });
        if (await School.findOne({ name })) return res.status(400).json({ msg: 'School with this name already exists.' });

        const school = new School({ name, capacity, city, county });
        await school.save();
        
        backendLogger.success('New school created.', { context, correlation_id, details: { schoolId: school._id, name } });
        res.status(201).json(school);
    } catch (err) {
        backendLogger.error('Failed to create school.', { context, correlation_id, details: { error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getSchools = async (req, res) => {
    const context = 'superadminController.getSchools';
    const { correlation_id } = req;
    try {
        const schools = await School.find({});
        res.json(schools);
    } catch (err) {
        backendLogger.error('Failed to get all schools.', { context, correlation_id, details: { error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateSchool = async (req, res) => {
    const context = 'superadminController.updateSchool';
    const { correlation_id } = req;
    try {
        // --- MODIFIED ---
        const { name, capacity, city, county } = req.body;
        const school = await School.findById(req.params.schoolId);

        if (!school) return res.status(404).json({ msg: 'School not found.' });

        school.name = name || school.name;
        school.capacity = capacity || school.capacity;
        // --- ADDED ---
        school.city = city || school.city;
        school.county = county || school.county;
        const updatedSchool = await school.save();

        backendLogger.info('School updated successfully.', { context, correlation_id, details: { schoolId: req.params.schoolId } });
        res.json(updatedSchool);
    } catch (err) {
        backendLogger.error('Failed to update school.', { context, correlation_id, details: { schoolId: req.params.schoolId, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.deleteSchool = async (req, res) => {
    const context = 'superadminController.deleteSchool';
    const { correlation_id } = req;
    try {
        const school = await School.findById(req.params.schoolId);
        if (!school) return res.status(404).json({ msg: 'School not found.' });

        await School.findByIdAndDelete(req.params.schoolId);
        
        backendLogger.warn('School deleted.', { context, correlation_id, details: { schoolId: req.params.schoolId } });
        res.json({ msg: 'School removed successfully.' });
    } catch (err) {
        backendLogger.error('Failed to delete school.', { context, correlation_id, details: { schoolId: req.params.schoolId, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.createSchoolAdmin = async (req, res) => {
    const context = 'superadminController.createSchoolAdmin';
    const { correlation_id } = req;
    const { email, schoolId } = req.body; // Username is removed
    try {
        if (await User.findOne({ email })) return res.status(400).json({ msg: 'Email already in use.' });
        
        const school = await School.findById(schoolId);
        if (!school) return res.status(404).json({ msg: 'School not found.' });

        // Create the admin but mark them as unverified until they activate
        const admin = new User({ 
            email, 
            school: schoolId, 
            username: email, // Default username to email, can be changed later
            role: 'schooladmin', 
            isVerified: false, // Admin must activate to be verified
            isApproved: true 
        });

        // Generate a token with a 2-day expiry
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        const activationToken = admin.getResetPasswordToken(twoDaysInMs);
        await admin.save({ validateBeforeSave: false });

        const activationUrl = `${process.env.FRONTEND_URL_EMAIL}/reset-password/${activationToken}`;

        const emailBody = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background-color: #1a1a1a; text-align: center;">
                    <img src="https://res.cloudinary.com/dcjyydmzs/image/upload/v1762106928/WhatsApp_Image_2025-11-02_at_23.25.36_ff066a38_hvxjnb.jpg" alt="XPARK Banner" style="max-width: 100%; height: auto; display: block;" />
                </div>
                <div style="padding: 40px 30px;">
                    <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Welcome to XPARK</h2>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px;">
                        You have been invited to become a school administrator for <strong>${school.name}</strong> on the XPARK platform.
                    </p>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">
                        To activate your account and access the administrator dashboard, please set up your profile and password by clicking the button below:
                    </p>
                    <div style="text-align: center; margin: 0 0 24px 0;">
                        <a href="${activationUrl}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Activate Your Account</a>
                    </div>
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 16px; margin: 0 0 16px 0;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
                            If the button above doesn't work, copy and paste this link into your web browser:
                        </p>
                        <p style="margin: 0; font-size: 13px; word-break: break-all;">
                            <a href="${activationUrl}" style="color: #007bff; text-decoration: underline;">${activationUrl}</a>
                        </p>
                    </div>
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 0 0 24px 0;">
                        <p style="margin: 0; font-size: 14px; color: #856404;">
                            <strong>Important:</strong> This activation link will expire in 2 days.
                        </p>
                    </div>
                    <p style="color: #333; line-height: 1.6; margin: 0; font-size: 16px;">
                        Best regards,<br>
                        <strong>The XPARK Games Team</strong>
                    </p>
                </div>
            </div>
        </div>`;

        await sendEmail({
            to: admin.email,
            subject: `Activate Your XPARK Administrator Account for ${school.name}`,
            html: emailBody
        });
        
        backendLogger.success('School admin created and activation email sent.', { context, correlation_id, details: { adminId: admin._id, schoolId } });
        res.status(201).json({ msg: 'Admin account created and activation email sent.'});
    } catch (err) {
        backendLogger.error('Failed to create school admin.', { context, correlation_id, details: { error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getSchoolAdmins = async (req, res) => {
    const context = 'superadminController.getSchoolAdmins';
    const { correlation_id } = req;
    try {
        const admins = await User.find({ role: 'schooladmin' }).populate('school', 'name capacity').select('-password');
        res.json(admins);
    } catch (err) {
        backendLogger.error('Failed to get school admins.', { context, correlation_id, details: { error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.deleteSchoolAdmin = async (req, res) => {
    const context = 'superadminController.deleteSchoolAdmin';
    const { correlation_id } = req;
    try {
        await User.findOneAndDelete({ _id: req.params.adminId, role: 'schooladmin' });
        backendLogger.warn('School admin deleted.', { context, correlation_id, details: { adminId: req.params.adminId } });
        res.json({ msg: 'School admin removed successfully.' });
    } catch (err) {
        backendLogger.error('Failed to delete school admin.', { context, correlation_id, details: { adminId: req.params.adminId, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

// --- THIS IS THE FIX: New controller to resend admin invitation ---
exports.resendAdminInvitation = async (req, res) => {
    const context = 'superadminController.resendAdminInvitation';
    const { correlation_id } = req;
    const { adminId } = req.params;

    try {
        const admin = await User.findById(adminId);
        if (!admin || admin.role !== 'schooladmin') {
            return res.status(404).json({ msg: 'School administrator not found.' });
        }
        if (admin.isVerified) {
            return res.status(400).json({ msg: 'This administrator account is already active.' });
        }

        const school = await School.findById(admin.school);
        if (!school) {
            return res.status(404).json({ msg: 'Associated school not found.' });
        }

        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        const activationToken = admin.getResetPasswordToken(twoDaysInMs);
        await admin.save({ validateBeforeSave: false });

        const activationUrl = `${process.env.FRONTEND_URL_EMAIL}/reset-password/${activationToken}`;

        const emailBody = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background-color: #1a1a1a; text-align: center;">
                    <img src="https://res.cloudinary.com/dcjyydmzs/image/upload/v1762106928/WhatsApp_Image_2025-11-02_at_23.25.36_ff066a38_hvxjnb.jpg" alt="XPARK Banner" style="max-width: 100%; height: auto; display: block;" />
                </div>
                <div style="padding: 40px 30px;">
                    <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Reminder: Activate Your XPARK Account</h2>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px;">
                        This is a reminder to activate your school administrator account for <strong>${school.name}</strong> on the XPARK platform.
                    </p>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">
                        To activate your account, please set up your profile and password by clicking the button below:
                    </p>
                    <div style="text-align: center; margin: 0 0 24px 0;">
                        <a href="${activationUrl}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Activate Your Account</a>
                    </div>
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 16px; margin: 0 0 16px 0;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
                            If the button above doesn't work, copy and paste this link into your web browser:
                        </p>
                        <p style="margin: 0; font-size: 13px; word-break: break-all;">
                            <a href="${activationUrl}" style="color: #007bff; text-decoration: underline;">${activationUrl}</a>
                        </p>
                    </div>
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 0 0 24px 0;">
                        <p style="margin: 0; font-size: 14px; color: #856404;">
                            <strong>Important:</strong> This new activation link will expire in 2 days.
                        </p>
                    </div>
                </div>
            </div>
        </div>`;

        await sendEmail({
            to: admin.email,
            subject: `Reminder: Activate Your XPARK Administrator Account for ${school.name}`,
            html: emailBody
        });

        backendLogger.success('Admin activation reminder sent.', { context, correlation_id, details: { adminId } });
        res.status(200).json({ msg: 'Activation reminder sent successfully.' });

    } catch (err) {
        backendLogger.error('Failed to resend admin invitation.', { context, correlation_id, details: { adminId, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};