import { Response } from 'express';
import db from '@config/dbConfig';
import { offers, tasks, users, fixxerProfiles } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';
import { sendPushNotification } from '@utils/pushNotification';
import { scheduleFixbitIncrement } from '@/utils/scheduler';

/**
 * Create a new offer for a task (Fixxer only)
 */
export const createOffer = async (req: AuthRequest, res: Response) => {
  try {
    const fixxerId = req.user?.userId;
    const { taskId, price, message, estimatedDuration } = req.body;

    if (!fixxerId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Check FixBits balance
    let fixxerProfile = await db.query.fixxerProfiles.findFirst({
      where: eq(fixxerProfiles.userId, fixxerId),
    });

    if (!fixxerProfile) {
      // Create a new Fixxer profile if it doesn't exist (First offer made)
      const [newProfile] = await db
        .insert(fixxerProfiles)
        .values({
          userId: fixxerId,
          // Default FixBits is 3 (defined in schema), enough for first offer
        })
        .returning();
      fixxerProfile = newProfile;
    }

    if (fixxerProfile.fixBits < 1) {
      return res.status(403).json({
        status: 'error',
        message:
          'Insufficient FixBits! You need 1 FixBit to make an offer. Please purchase FixBits.',
      });
    }

    // Validate required fields
    if (!taskId || !price) {
      return res.status(400).json({
        status: 'error',
        message: 'Task ID and price are required',
      });
    }

    // Check if task exists and is open for offers
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }

    if (task.status !== 'posted') {
      return res.status(400).json({
        status: 'error',
        message: 'This task is no longer accepting offers',
      });
    }

    // Prevent client from making offer on their own task
    if (task.clientId === fixxerId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot make an offer on your own task',
      });
    }

    // Check if fixxer already made an offer on this task
    const existingOffer = await db.query.offers.findFirst({
      where: and(eq(offers.taskId, taskId), eq(offers.fixxerId, fixxerId)),
    });

    if (existingOffer) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already made an offer on this task',
      });
    }

    // Create the offer
    const [newOffer] = await db
      .insert(offers)
      .values({
        taskId,
        fixxerId,
        price: price.toString(),
        message: message || null,
        estimatedDuration: estimatedDuration || null,
        status: 'pending',
      })
      .returning();

    // Deduct 1 FixBit
    await db
      .update(fixxerProfiles)
      .set({ fixBits: fixxerProfile.fixBits - 1 })
      .where(eq(fixxerProfiles.id, fixxerProfile.id));

    scheduleFixbitIncrement(fixxerProfile.id);
    // Update task offer count
    await db
      .update(tasks)
      .set({
        offerCount: task.offerCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    // Get client info for notification
    const client = await db.query.users.findFirst({
      where: eq(users.id, task.clientId),
    });

    // Get fixxer info for notification
    const fixxer = await db.query.users.findFirst({
      where: eq(users.id, fixxerId),
    });

    // Send push notification to client
    if (client?.fcmToken) {
      await sendPushNotification(
        client.fcmToken,
        'New Offer Received!',
        `${fixxer?.name || 'A Fixxer'} has made an offer of ₹${price} on your task "${task.taskTitle}"`,
        {
          taskId,
          offerId: newOffer.id,
          type: 'new_offer',
          recipientRole: 'client',
          showOffersModal: 'true',
        },
      );
    }

    return res.status(201).json({
      status: 'ok',
      message: 'Offer created successfully',
      data: newOffer,
    });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create offer',
    });
  }
};
