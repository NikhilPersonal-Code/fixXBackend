import db from '@/config/dbConfig';
import { users } from '@/db/tables';
import { User } from '@/types';
import { eq } from 'drizzle-orm';
import { Response } from 'express';

export const checkUserBlockStatus = async ({
  res,
  user,
  userId,
}: {
  res: Response;
  user?: User;
  userId?: string;
}) => {
  // if (user) {
  //   if (user.blocked) {
  //     return res
  //       .json({
  //         success: false,
  //         message: 'User is blocked contact the developer kindly.',
  //       })
  //       .status(404);
  //   }
  //   return null;
  // }
  if (userId) {
    const [dbUser] = await db
      .select({ blocked: users.blocked })
      .from(users)
      .where(eq(users.id, userId));
    if (dbUser.blocked) {
      return res
        .json({
          success: false,
          message:
            'User is blocked contact the developer kindly to resolve issue',
        })
        .status(401);
    }
  }
  return null;
};
