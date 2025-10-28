const nodemailer = require('nodemailer');
const { getTransporter } = require('../config/nodemailer');

exports.sendEmail = async (options) => {
    try {
        const transporter = await getTransporter();

        // --- THE FIX ---
        // Instead of manually picking properties, we create a base object
        // and then spread the incoming options into it. This will automatically
        // include any valid nodemailer properties like 'to', 'subject', 'text', and 'html'.
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            ...options
        };

        const info = await transporter.sendMail(mailOptions);
        
        // This log is useful for debugging in development
        if (process.env.NODE_ENV !== 'production') {
            console.log('Email sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }

    } catch (error) {
        console.error('Email could not be sent:', error);
        throw new Error('Email could not be sent.');
    }
};