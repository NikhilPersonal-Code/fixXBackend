import admin from '@config/firebaseConfig';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { ne, isNotNull, and } from 'drizzle-orm';

/**
 * Send push notification to a single user by FCM token
 */
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> => {
  try {
    if (!fcmToken) {
      console.warn('No FCM token provided for push notification');
      return;
    }

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });

    console.log('Push notification sent successfully:', { title, body });
  } catch (error: any) {
    console.error('Failed to send push notification:', error.message);

    // Handle invalid token errors
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      console.warn(
        'Invalid FCM token detected, should be removed from database',
      );
    }
  }
};

/**
 * Send push notification to all users except one
 */
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

    console.log(`Push notifications sent to ${tokens.length} users`);
  } catch (error) {
    console.error('Push notification error:', error);
  }
};

/**
 * Send push notification to multiple specific users
 */
export const sendPushToMultiple = async (
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> => {
  try {
    const validTokens = fcmTokens.filter((token) => !!token);

    if (validTokens.length === 0) {
      console.warn('No valid FCM tokens provided');
      return;
    }

    const result = await admin.messaging().sendEachForMulticast({
      tokens: validTokens,
      notification: { title, body },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });

    console.log(
      `Push notifications sent: ${result.successCount} succeeded, ${result.failureCount} failed`,
    );
  } catch (error) {
    console.error(
      'Failed to send push notifications to multiple users:',
      error,
    );
  }
};
