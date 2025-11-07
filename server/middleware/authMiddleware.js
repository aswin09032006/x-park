const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { backendLogger } = require('../config/logger');

exports.protect = async (req, res, next) => {
    const context = 'authMiddleware.protect';
    const { correlation_id } = req;
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                backendLogger.warn('Authorization failed, user not found for token.', { context, correlation_id, details: { userId: decoded.id } });
                return res.status(401).json({ msg: 'Not authorized, user not found' });
            }
            next();
        } catch (error) { 
            backendLogger.error('Authorization failed, token is invalid.', { context, correlation_id, details: { error: error.message } });
            res.status(401).json({ msg: 'Not authorized, token failed' }); 
        }
    }
    if (!token) {
        backendLogger.warn('Authorization failed, no token provided.', { context, correlation_id });
        res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

exports.isSchoolAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'schooladmin') {
        next();
    } else {
        backendLogger.warn('Access denied. School admin role required.', { context: 'authMiddleware.isSchoolAdmin', correlation_id: req.correlation_id, details: { userId: req.user.id, role: req.user.role } });
        res.status(403).json({ msg: 'Access denied. School admin role required.' });
    }
};

exports.isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        backendLogger.warn('Access denied. Super admin role required.', { context: 'authMiddleware.isSuperAdmin', correlation_id: req.correlation_id, details: { userId: req.user.id, role: req.user.role } });
        res.status(403).json({ msg: 'Access denied. Super admin role required.' });
    }
};