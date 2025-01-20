var nodemailer = require("nodemailer");
var { config } = require('../configs/config');

const mailConfig = {
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: config.mp,
      pass: config.gp
    }
}

exports.sendEmail = async (email, password) => {
    const transporter = await nodemailer.createTransport(mailConfig);
    let info = await transporter.sendMail({
        from: 'no-reply@tailor-app.com', // sender address
        to: email, // list of receivers
        subject: "Forgot password: Tailor App", // Subject line
        text: "Admin password has been changed", // plain text body
        cc: 'tailor@gmail.com',
        html: `<p>You are receiving this email because you(or someone else) have requested the reset of the admin's password.</p> 
            <p>Please click on the following link, or paste this on browser to complete the process.</p>
            <a href='${config.HOST}/reset-password;key=${password}'><p>${config.HOST}/reset-password;key=${password}</p></a>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            ` // html body
    });
    nodemailer.getTestMessageUrl(info);
}