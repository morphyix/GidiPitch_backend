// send mail function using sendgrid
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const { AppError } = require('./error');


const sendMail = async (to, subject, from, text, html) => {
    try {
        const mailerSend = new MailerSend({
            apiKey: process.env.SENDGRID_SECRET_KEY,
        });

        const sentFrom = new Sender(from, process.env.BRAND_NAME || 'Smart Commerce');

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


module.exports = { sendMail };