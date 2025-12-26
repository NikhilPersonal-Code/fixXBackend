"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = exports.sendPasswordResetEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configure the email transporter.
// I'm using Gmail as an example. For production, consider a transactional email service
// like SendGrid, Mailgun, or AWS SES.
const transporter = nodemailer_1.default.createTransport({
    auth: {
        user: process.env.USER_EMAIL, // Your email address from .env
        pass: process.env.USER_EMAIL_APP_PASSWORD, // Your email password or app-specific password from .env
    },
    service: 'gmail',
});
const sendPasswordResetEmail = async (to, otp) => {
    const mailOptions = {
        from: `"Your App" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Your Password Reset OTP',
        html: `
      <p>You requested a password reset.</p>
      <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
    };
    await transporter.sendMail(mailOptions);
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendVerificationEmail = async (to, otp) => {
    const mailOptions = {
        from: `"Your App" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verify Your Email Address for YourApp',
        html: `
      <p>Welcome to YourApp! Please use the following One-Time Password (OTP) to verify your email address.</p>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
    };
    await transporter.sendMail(mailOptions);
    return otp;
};
exports.sendVerificationEmail = sendVerificationEmail;
