import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail, sendVerificationEmail } from '@utils/mailer';

export const sendForgotPasswordOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always send a success response to prevent user enumeration attacks
    if (!user) {
      return res.json({
        message:
          'If an account with that email exists, a reset OTP has been sent.',
      });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Store the OTP and its expiration in the database
    await db
      .update(users)
      .set({ resetToken: otp, resetTokenExpires: otpExpires })
      .where(eq(users.email, email));

    // Send the email
    await sendPasswordResetEmail(email, otp);

    res.json({
      message:
        'If an account with that email exists, a reset OTP has been sent.',
      status: 'ok',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    // Generic error to avoid leaking information
    res.status(500).json({ message: 'An error occurred.' });
  }
};
