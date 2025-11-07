// --- /backend/services/emailService.js ---
const nodemailer = require('nodemailer');
const { getTransporter } = require('../config/nodemailer');
const { backendLogger } = require('../config/logger');

exports.sendEmail = async (options) => {
    const context = 'emailService.sendEmail';
    try {
        const transporter = await getTransporter();
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            ...options
        };

        const info = await transporter.sendMail(mailOptions);
        
        if (process.env.NODE_ENV !== 'production') {
            backendLogger.debug(`Email sent! Preview URL: ${nodemailer.getTestMessageUrl(info)}`, { context });
        }
    } catch (error) {
        backendLogger.error('Email could not be sent.', { context, details: { error: error.message, stack: error.stack, to: options.to, subject: options.subject }});
        throw new Error('Email could not be sent.');
    }
};