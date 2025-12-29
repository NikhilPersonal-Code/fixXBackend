import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const loginUser = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;
  const searchParam = username && !email ? username : email;

  const userFromDB = await db.query.users.findFirst({
    where:
      username && !email
        ? eq(users.username, searchParam)
        : eq(users.email, searchParam),
  });

  if (!userFromDB) {
    return res.status(401).json({ message: 'User not found' });
  }

  const valid = await bcrypt.compare(
    password,
    userFromDB.passwordHash as string,
  );
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  await db
    .update(users)
    .set({ isActive: true })
    .where(eq(users.id, userFromDB.id));

  const user = {
    id: userFromDB.id,
    name: userFromDB.name,
    email: userFromDB.email,
    username: userFromDB.username,
    picture: userFromDB.profileUrl,
  };
  const token = jwt.sign(
    {
      userId: user.id,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '1d' },
  );

  res.json({ token, status: 'ok', user });
};
