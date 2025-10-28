const nodemailer = require('nodemailer');

let transporter;

const getTransporter = async () => {
    if (transporter) {
        return transporter;
    }

    console.log('Using Gmail (Production) email service.');

    transporter = nodemailer.createTransport({
        host: process.env.PROD_EMAIL_HOST || "smtp.gmail.com",
        port: process.env.PROD_EMAIL_PORT || 465,
        secure: true, // 465 is SSL
        auth: {
            user: process.env.PROD_EMAIL_USER,
            pass: process.env.PROD_EMAIL_PASS,
        },
    });

    return transporter;
};

module.exports = { getTransporter };