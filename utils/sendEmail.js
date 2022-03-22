    const nodemailer = require('nodemailer')
const sendEmail = (options) => {
    const transporter = nodemailer.createTransport({
      service:  "gmail",
      auth: {
        user: 'patoliya.rk1@gmail.com',
        pass: 'password@12345',
      },
      port:587,
    });
  
    const mailOptions = {
      from:'patoliy.rk1@gmail.com',
      to: options.to,
      subject: options.subject,
      html: options.text,
    };
  
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log("err", err);
      } else {
        console.log("success", info);
      }
    });
  };
  
  module.exports = sendEmail;