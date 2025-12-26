import axios from 'axios';

const EMAIL_API_URL = 'https://attenex-email-backend.vercel.app/send-email';

export const sendPasswordResetEmail = async (
  to: string,
  otp: string | number,
): Promise<void> => {
  const subject = 'Your Password Reset OTP for FixX';
  const text = `You requested a password reset. Your OTP is: ${otp}. This OTP is valid for 10 minutes.`;
  const html = `
    <p>You requested a password reset.</p>
    <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
    <p>This OTP is valid for 10 minutes.</p>
  `;

  await axios.post(EMAIL_API_URL, {
    to,
    subject,
    text,
    html,
  });
};

export const sendVerificationEmail = async (
  to: string,
  otp: string | number,
): Promise<string | number> => {
  const subject = 'Verify Your Email Address for FixX';
  const text = `Welcome to FixX! Your OTP is: ${otp}. This OTP is valid for 10 minutes.`;
  const html = `
    <p>Welcome to FixX! Please use the following One-Time Password (OTP) to verify your email address.</p>
    <p>Your OTP is: <strong>${otp}</strong></p>
    <p>This OTP is valid for 10 minutes.</p>
  `;

  await axios.post(EMAIL_API_URL, {
    to,
    subject,
    text,
    html,
  });

  return otp;
};
