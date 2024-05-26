const nodemailer = require('nodemailer');

async function sendMail(email, theme, text, textHtml) {
    let transporter = nodemailer.createTransport({
        host: "smtp.yandex.ru",
        port: 25,
        secure: false,
        auth: {
            user: 'info@godinecoffee.ru',
            pass: 'gckpbjasgcbcybxe'
        }
    });

    let message = {
        from: 'GodineCoffee <info@godinecoffee.ru>',
        to: email,
        subject: theme,
        text: text,
        html: textHtml
    };

    await transporter.sendMail(message);
}

module.exports = { sendMail };
