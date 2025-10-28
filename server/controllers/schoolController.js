const School = require('../models/School');
const PreRegisteredStudent = require('../models/PreRegisteredStudent'); // Import this model

// @desc    Get all schools
// @route   GET /api/schools
// @access  Public
exports.getSchools = async (req, res) => {
    try {
        const schools = await School.find({}).sort({ name: 1 });
        res.json(schools);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get a single school by its slug
// @route   GET /api/schools/slug/:slug
// @access  Public
exports.getSchoolBySlug = async (req, res) => {
    try {
        const school = await School.findOne({ slug: req.params.slug });
        if (!school) {
            return res.status(404).json({ msg: 'School not found.' });
        }
        res.json(school);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// --- THIS FUNCTION IS THE CORE OF THE NEW LOGIC ---
// @desc    Find a school by checking the pre-registered student list
// @route   GET /api/schools/email-lookup
// @access  Public
exports.getSchoolByPreRegisteredEmail = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ msg: 'An email address is required.' });
    }

    try {
        // Find an invitation that is still pending
        const preReg = await PreRegisteredStudent.findOne({ 
            email: email.toLowerCase(),
            status: 'pending' 
        }).populate('school'); // Use populate to get the full school details

        if (!preReg || !preReg.school) {
            return res.status(404).json({ msg: 'This email has not been pre-registered by an administrator.' });
        }

        // Return the school object associated with the invitation
        res.json(preReg.school);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};