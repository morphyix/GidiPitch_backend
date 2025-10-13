// send mail function using sendgrid
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const nodemailer = require('nodemailer');
const { AppError } = require('./error');


const sendMail = async (to, subject, from, text, html) => {
    try {
        const mailerSend = new MailerSend({
            apiKey: process.env.SENDGRID_SECRET_KEY,
        });

        const sentFrom = new Sender(from, process.env.BRAND_NAME || 'Gidi Pitch Team');

        let recipients = [];

        // check if 'to' is an array or a single email
        if (Array.isArray(to) && to.length > 0) {
            recipients = to.map(email => new Recipient(email));
        } else if (typeof to === 'string') {
            recipients = [new Recipient(to)];
        } else {
            throw new AppError('Invalid recipient email format', 400);
        }
        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setSubject(subject)
            .setText(text)
            .setHtml(html);

        await mailerSend.email.send(emailParams);
        console.log("Email sent successfully to:", to);
    } catch (error) {
        console.error("Error sending email: ", error);
        if (error.response) {
            console.error("Response body: ", error.response.body);
        }
    }
};


const mailTransporter = nodemailer.createTransport({
    host: 'smtp.mailersend.net',
    port: 587,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const mailSender = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: 'noreply @techfortress.qzz.io',
            to,
            subject,
            text,
            html,
        };

        await mailTransporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error in mailSender: ", error);
    }
};


module.exports = { sendMail, mailSender };