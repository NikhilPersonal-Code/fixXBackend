import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure the email transporter.
// I'm using Gmail as an example. For production, consider a transactional email service
// like SendGrid, Mailgun, or AWS SES.
const transporter = nodemailer.createTransport({
  auth: {
    user: process.env.USER_EMAIL, // Your email address from .env
    pass: process.env.USER_EMAIL_APP_PASSWORD, // Your email password or app-specific password from .env
  },
  service: 'gmail',
});

export const sendPasswordResetEmail = async (
  to: string,
  otp: string | number,
): Promise<void> => {
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

export const sendVerificationEmail = async (
  to: string,
  otp: string | number,
): Promise<string | number> => {
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
