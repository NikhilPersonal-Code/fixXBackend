import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users, otps } from '@db/tables';
import { eq, or, and, gt } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { downloadImage } from '@utils/imageDownloader';
import { sendPasswordResetEmail, sendVerificationEmail } from '@utils/mailer';
import { promises as fs } from 'fs';
import path from 'path';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  let tokenData;
  try {
    // 1. Verify Google Token

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }
    const { email, name, sub, picture } = payload;
    const username = email?.split('@')[0];
    // 2. Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email!),
    });

    let userId;
    if (!existingUser) {
      // Download the Google profile picture to our server
      const localProfileUrl = picture ? await downloadImage(picture) : null;

      // 3. Register new Google user
      const hashed = await bcrypt.hash(sub, 10); // hash Google sub as pseudo password

      const [result] = await db
        .insert(users)
        .values({
          username: username!,
          name: name!,
          email: email!,
          passwordHash: hashed,
          profileUrl: localProfileUrl,
          isActive: true,
        })
        .returning({ insertId: users.id });

      userId = result.insertId;
      tokenData = {
        id: userId,
        name: name,
        email: email,
        username: username,
      };
    } else {
      userId = existingUser.id;
      await db
        .update(users)
        .set({ isActive: true })
        .where(eq(users.id, userId));

      // If the user's profileUrl is still a google url, download it and update it.
      if (
        existingUser.profileUrl &&
        existingUser.profileUrl.startsWith('http')
      ) {
        const localProfileUrl = await downloadImage(existingUser.profileUrl);
        await db
          .update(users)
          .set({ profileUrl: localProfileUrl })
          .where(eq(users.id, userId));
      } else if (!existingUser.profileUrl && picture) {
        const localProfileUrl = await downloadImage(picture);
        await db
          .update(users)
          .set({ profileUrl: localProfileUrl })
          .where(eq(users.id, userId));
      }
      tokenData = {
        id: userId,
        name: existingUser.name,
        email: existingUser.email,
        username: existingUser.username,
      };
    }

    const userWithImage = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { profileUrl: true },
    });

    // 4. Generate JWT
    const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
      expiresIn: '1d',
    });
    const userData = { ...tokenData, picture: userWithImage?.profileUrl };
    return res.json({
      token,
      userData,
      status: 'ok',
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Invalid Google token' });
  }
};

export const sendEmailRegistrationOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  console.log("email : "+email);
  

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

export const loginUser = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;
  const searchParam = username && !email ? username : email;

  const user = await db.query.users.findFirst({
    where:
      username && !email
        ? eq(users.username, searchParam)
        : eq(users.email, searchParam),
  });

  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash as string);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  await db.update(users).set({ isActive: true }).where(eq(users.id, user.id));

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    picture: user.profileUrl,
  };
  const token = jwt.sign(
    {
      userId: user.id,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '1d' },
  );

  res.json({ token, status: 'ok', userData });
};

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

export const logoutUser = async (req: Request, res: Response) => {
  const { id } = req.body;

  await db.update(users).set({ isActive: true }).where(eq(users.id, id));
  res.json({ message: 'User logged out successfully' });
};

export const deleteAccount = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const id = userId;

  try {
    return await db.transaction(async (tx) => {
      // Get user's profile URL before deleting the user record
      const user = await tx.query.users.findFirst({
        where: eq(users.id, id),
        columns: { profileUrl: true },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const profileUrl = user.profileUrl;

      // 4. Delete the user from the users table.
      await tx.delete(users).where(eq(users.id, id));

      // After successful commit, delete the profile image file
      if (profileUrl && profileUrl.startsWith('/uploads/')) {
        const filename = path.basename(profileUrl);
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          'public',
          'uploads',
          filename,
        );
        try {
          await fs.unlink(filePath);
          console.log(`Successfully deleted profile image: ${filePath}`);
        } catch (deleteError) {
          // Log the error but don't fail the overall operation,
          // as the user's data has already been deleted from the DB.
          console.error(
            `Error deleting profile image ${filePath}:`,
            deleteError,
          );
        }
      }

      return res.json({
        message: 'Account deleted successfully.',
        status: 'ok',
      });
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res
      .status(500)
      .json({ message: 'Database error during account deletion.' });
  }
};
