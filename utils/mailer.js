const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// Configure the email transporter.
// I'm using Gmail as an example. For production, consider a transactional email service
// like SendGrid, Mailgun, or AWS SES.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email address from .env
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password from .env
  },
});

const sendPasswordResetEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Your App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Password Reset OTP",
    html: `
      <p>You requested a password reset.</p>
      <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Your App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify Your Email Address for YourApp",
    html: `
      <p>Welcome to YourApp! Please use the following One-Time Password (OTP) to verify your email address.</p>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  return otp;
};

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
