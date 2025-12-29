import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users, otps } from '@db/tables';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const registerUser = async (req: Request, res: Response) => {
  const { email, password, otp, username, name } = req.body;

  try {
    const otpRecord = await db.query.otps.findFirst({
      where: eq(otps.email, email),
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Some Error Occured Try Again' });
    }

    if (otp !== otpRecord.otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    } else {
      return await db.transaction(async (tx) => {
        const existingUser = await tx.query.users.findFirst({
          where: or(eq(users.username, username), eq(users.email, email)),
        });

        if (existingUser) {
          return res.status(409).json({
            message: 'Username or email already exists. Try another.',
          });
        }

        const hashed = await bcrypt.hash(password, 10);

        await tx.insert(users).values({
          passwordHash: hashed,
          name,
          email,
          username,
        });

        await tx.delete(otps).where(eq(otps.email, email));

        return res.status(201).json({
          message: 'Email Verified and User registered successfully',
          status: 'ok',
        });
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
};
