// send mail function using sendgrid
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const { MailtrapClient } = require('mailtrap');
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


const mailSender = async (from, to, subject, text, html, category) => {
    const TOKEN = process.env.SENDGRID_SECRET_KEY;
    try {
        const client = new MailtrapClient({ token: TOKEN });
        
        const sender = {
            email: from,
            name: 'GidiPitch Team'
        };

        const recipients = [
            {
                email: to,
            }
        ];

        client
            .send({
                from: sender,
                to: recipients,
                subject: subject,
                text: text,
                html: html,
                category: category || 'Email Verification'
            })
            .then(console.log, console.error);
    } catch (error) {
        console.error("Error in mailSender: ", error);
    }
};



module.exports = { sendMail, mailSender };