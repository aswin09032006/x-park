const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ msg: 'Not authorized, user not found' });
            next();
        } catch (error) { res.status(401).json({ msg: 'Not authorized, token failed' }); }
    }
    if (!token) res.status(401).json({ msg: 'Not authorized, no token' });
};

// --- RENAME for clarity ---
exports.isSchoolAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'schooladmin') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. School admin role required.' });
    }
};

// --- NEW SUPER ADMIN MIDDLEWARE ---
exports.isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Super admin role required.' });
    }
};