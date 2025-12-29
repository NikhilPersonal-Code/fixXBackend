import { Response } from 'express';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/common';

export const updateFcmToken = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { fcmToken } = req.body;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!fcmToken) {
      return res
        .status(400)
        .json({ status: 'error', message: 'fcmToken required' });
    }

    await db.update(users).set({ fcmToken }).where(eq(users.id, userId));

    return res.json({ status: 'ok', message: 'FCM token updated' });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
