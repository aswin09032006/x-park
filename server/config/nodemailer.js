const nodemailer = require('nodemailer');
const { backendLogger } = require('./logger');

let transporter;

const getTransporter = async () => {
    if (transporter) {
        return transporter;
    }

    const context = 'nodemailer.getTransporter';
    backendLogger.info('Initializing email transporter.', { context });

    transporter = nodemailer.createTransport({
        host: process.env.PROD_EMAIL_HOST || "smtp.gmail.com",
        port: process.env.PROD_EMAIL_PORT || 465,
        secure: true,
        auth: {
            user: process.env.PROD_EMAIL_USER,
            pass: process.env.PROD_EMAIL_PASS,
        },
    });

    return transporter;
};

module.exports = { getTransporter };