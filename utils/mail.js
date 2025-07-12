// send mail function using sendgrid
const sgMail = require('@sendgrid/mail');


const sendMail = async (to, subject, from, text, html) => {
    try {
        sgMail.setApiKey(process.env.SENDGRID_SECRET_KEY);

        const msg = {
            to,
            from,
            subject,
            text,
            html,
        }

        await sgMail.send(msg).then(() => {
            console.log("Email Sent: ", subject);
        })
    } catch (error) {
        console.error("Error sending email: ", error);
        if (error.response) {
            console.error("Response body: ", error.response.body);
        }
    }
};


module.exports = { sendMail };