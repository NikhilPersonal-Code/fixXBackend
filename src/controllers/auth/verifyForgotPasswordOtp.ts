import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { and, eq, gt } from 'drizzle-orm';

export const verifyForgotPasswordOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  try {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.email, email),
        eq(users.resetToken, otp),
        gt(users.resetTokenExpires, new Date()),
      ),
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    res.json({ message: 'OTP verified successfully.', status: 'ok' });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ message: 'An error occurred.' });
  }
};
