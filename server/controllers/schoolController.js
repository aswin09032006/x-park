const School = require('../models/School');
const PreRegisteredStudent = require('../models/PreRegisteredStudent');
const { backendLogger } = require('../config/logger');

exports.getSchools = async (req, res) => {
    const context = 'schoolController.getSchools';
    const { correlation_id } = req;
    try {
        const schools = await School.find({}).sort({ name: 1 });
        res.json(schools);
    } catch (err) {
        backendLogger.error('Failed to get schools.', { context, correlation_id, details: { error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getSchoolBySlug = async (req, res) => {
    const context = 'schoolController.getSchoolBySlug';
    const { correlation_id } = req;
    try {
        const school = await School.findOne({ slug: req.params.slug });
        if (!school) {
            backendLogger.warn('School not found by slug.', { context, correlation_id, details: { slug: req.params.slug } });
            return res.status(404).json({ msg: 'School not found.' });
        }
        res.json(school);
    } catch (err) {
        backendLogger.error('Failed to get school by slug.', { context, correlation_id, details: { slug: req.params.slug, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getSchoolByPreRegisteredEmail = async (req, res) => {
    const context = 'schoolController.getSchoolByPreRegisteredEmail';
    const { correlation_id } = req;
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ msg: 'An email address is required.' });
    }

    try {
        const preReg = await PreRegisteredStudent.findOne({ 
            email: email.toLowerCase(),
            status: 'pending' 
        }).populate('school');

        if (!preReg || !preReg.school) {
            backendLogger.info('Email lookup did not find a pre-registered school.', { context, correlation_id, details: { email } });
            return res.status(404).json({ msg: 'This email has not been pre-registered by an administrator.' });
        }
        
        backendLogger.success('Found pre-registered school via email lookup.', { context, correlation_id, details: { email, schoolId: preReg.school._id } });
        res.json(preReg.school);

    } catch (err) {
        backendLogger.error('Error during school email lookup.', { context, correlation_id, details: { email, error: err.message, stack: err.stack } });
        res.status(500).json({ msg: 'Server Error' });
    }
};