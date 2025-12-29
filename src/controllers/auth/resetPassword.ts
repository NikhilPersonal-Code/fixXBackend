import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { and, eq, gt } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  try {
    // First, re-verify the OTP to ensure it's still valid
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

    // Hash the new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update the password and clear the reset token fields
    await db
      .update(users)
      .set({
        passwordHash: hashed,
        resetToken: null,
        resetTokenExpires: null,
      })
      .where(eq(users.email, email));

    res.json({
      message: 'Password has been reset successfully.',
      status: 'ok',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'An error occurred.' });
  }
};
