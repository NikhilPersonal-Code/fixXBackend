import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { eq } from 'drizzle-orm';

export const logoutUser = async (req: Request, res: Response) => {
  const { id } = req.body;

  await db.update(users).set({ isActive: false }).where(eq(users.id, id));
  res.json({ message: 'User logged out successfully' });
};
