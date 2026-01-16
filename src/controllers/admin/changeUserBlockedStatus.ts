import db from '@/config/dbConfig';
import { users } from '@/db/tables';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';

export const changeUserBlockedStatus = async (req: Request, res: Response) => {
  const userId = req.body.userId;
  const blocked = req.body.blocked;
  if (!userId) {
    return res
      .json({
        success: false,
        message: 'User id not given',
      })
      .status(500);
  }
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return res
      .json({
        success: false,
        message: 'User not found',
      })
      .status(500);
  }
  if (typeof blocked !== 'boolean' || blocked === user.blocked) {
    return res
      .json({
        success: false,
        message: `Send correct blocked value or user is already ${!blocked && 'un'}blocked`,
      })
      .status(500);
  }
  await db.update(users).set({ blocked: blocked }).where(eq(users.id, userId));
  return res.json({
    success: true,
    message: `User is ${blocked ? 'blocked' : 'unblocked'}`,
  });
};
