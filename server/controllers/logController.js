const { frontendLogger } = require('../config/logger');

exports.logFromFrontend = (req, res) => {
    const { level, message, context, correlation_id, details } = req.body;
    const user_id = req.user ? req.user.id : 'anonymous';

    const validLevels = ['error', 'warn', 'info', 'success', 'debug'];
    if (!level || !validLevels.includes(level)) {
        frontendLogger.warn('Invalid log level received from frontend.', {
            context: 'logController',
            correlation_id,
            user_id,
            details: { receivedLevel: level }
        });
        return res.status(400).json({ msg: 'Invalid log level provided.' });
    }
    
    frontendLogger[level](message, {
        context,
        correlation_id,
        user_id,
        details
    });

    res.status(202).send();
};