import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users, otps } from '@db/tables';
import { eq } from 'drizzle-orm';
import { sendVerificationEmail } from '@utils/mailer';

export const sendEmailRegistrationOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!existingUser) {
      const sentOtp = Math.floor(100000 + Math.random() * 900000).toString();

      const existingOtp = await db.query.otps.findFirst({
        where: eq(otps.email, email),
      });

      if (!existingOtp) {
        await sendVerificationEmail(email, sentOtp);
        await db.insert(otps).values({
          email,
          otp: sentOtp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }); // OTP expires in 10 minutes
      } else {
        await sendVerificationEmail(email, sentOtp);
        await db
          .update(otps)
          .set({ otp: sentOtp })
          .where(eq(otps.email, email));
      }
      return res.status(200).json({ message: 'OTP Sent', status: 'ok' });
    } else {
      return res
        .status(409)
        .json({ message: 'This Email is already registered' });
    }
  } catch (error) {
    console.error('Send Registration OTP Error:', error);
    return res.status(500).json({ message: 'An error occurred.' });
  }
};
