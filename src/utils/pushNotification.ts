import admin from '@config/firebaseConfig';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { ne, isNotNull, and } from 'drizzle-orm';

export const sendPushToAllExcept = async (
  excludeUserId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) => {
  try {
    // Get all users with FCM tokens except the excluded user
    const usersWithTokens = await db
      .select({ fcmToken: users.fcmToken })
      .from(users)
      .where(and(ne(users.id, excludeUserId), isNotNull(users.fcmToken)));

    const tokens = usersWithTokens
      .map((u) => u.fcmToken)
      .filter((t): t is string => !!t);

    if (tokens.length === 0) return;
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
    });
  } catch (error) {
    console.error('Push notification error:', error);
  }
};
