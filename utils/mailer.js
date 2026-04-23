const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // atau gunakan SMTP provider lain
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: '"Sistem Sekolah" <noreply@school.com>',
    to,
    subject,
    text,
  });
};