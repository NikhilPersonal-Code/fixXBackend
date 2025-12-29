import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { uploadImageToCloudinary } from '@utils/imageDownloader';

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
      const localProfileUrl = picture
        ? await uploadImageToCloudinary(picture)
        : null;

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
        existingUser.profileUrl.startsWith('http') &&
        existingUser.profileUrl.includes('googleusercontent.com')
      ) {
        const localProfileUrl = await uploadImageToCloudinary(
          existingUser.profileUrl,
        );
        await db
          .update(users)
          .set({ profileUrl: localProfileUrl })
          .where(eq(users.id, userId));
      } else if (!existingUser.profileUrl && picture) {
        const localProfileUrl = await uploadImageToCloudinary(picture);
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
      expiresIn: '29d',
    });
    const user = { ...tokenData, profileUrl: userWithImage?.profileUrl };
    console.log(user);
    return res.json({
      token,
      user,
      status: 'ok',
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Invalid Google token' });
  }
};
