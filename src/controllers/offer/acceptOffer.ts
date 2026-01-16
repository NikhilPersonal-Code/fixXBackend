import { Response } from 'express';
import db from '@config/dbConfig';
import { offers, tasks, bookings, users } from '@db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';
import { sendPushNotification } from '@utils/pushNotification';

/**
 * Accept an offer (Client only)
 * This creates a booking and moves task to "in_progress" status
 */
export const acceptOffer = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.userId;
    const offerId = req.params.offerId as string;

    if (!clientId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Get the offer with task details
    const offer = await db.query.offers.findFirst({
      where: eq(offers.id, offerId),
      with: {
        task: true,
      },
    });

    if (!offer) {
      return res.status(404).json({
        status: 'error',
        message: 'Offer not found',
      });
    }

    // Verify client owns the task
    if (offer.task.clientId !== clientId) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to accept this offer',
      });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `This offer has already been ${offer.status}`,
      });
    }

    // Check if task is still accepting offers
    if (offer.task.status !== 'posted') {
      return res.status(400).json({
        status: 'error',
        message: 'This task is no longer accepting offers',
      });
    }

    // Start transaction
    // 1. Update offer status to accepted
    await db
      .update(offers)
      .set({
        status: 'accepted',
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(offers.id, offerId));

    // 2. Reject all other pending offers for this task
    await db
      .update(offers)
      .set({
        status: 'rejected',
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(offers.taskId, offer.taskId),
          ne(offers.id, offerId),
          eq(offers.status, 'pending'),
        ),
      );

    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, offer.taskId));

    const now = new Date();

    // 3. Update task status to in_progress and assign fixxer
    await db
      .update(tasks)
      .set({
        status: 'in_progress',
        assignedFixxerId: offer.fixxerId,
        updatedAt: now,
      })
      .where(eq(tasks.id, offer.taskId));

    // 4. Create booking record
    const [booking] = await db
      .insert(bookings)
      .values({
        taskId: offer.taskId,
        clientId: clientId,
        fixxerId: offer.fixxerId,
        offerId: offer.id,
        agreedPrice: offer.price,
        status: 'in_progress',
        startedAt: task.scheduledAt ? task.scheduledAt : now,
      })
      .returning();

    // Get fixxer info for notification
    const fixxer = await db.query.users.findFirst({
      where: eq(users.id, offer.fixxerId),
    });

    // Get client info for notification
    const client = await db.query.users.findFirst({
      where: eq(users.id, clientId),
    });

    // Send push notification to fixxer
    if (fixxer?.fcmToken) {
      await sendPushNotification(
        fixxer.fcmToken,
        'Offer Accepted! ',
        `${client?.name || 'Client'} has accepted your offer for "${offer.task.taskTitle}". You can now start working on the task.`,
        {
          taskId: offer.taskId,
          bookingId: booking.id,
          type: 'offer_accepted',
          recipientRole: 'fixxer',
        },
      );
    }

    return res.json({
      status: 'ok',
      message: 'Offer accepted successfully',
      data: {
        booking,
        task: {
          id: offer.taskId,
          status: 'in_progress',
        },
      },
    });
  } catch (error: any) {
    console.error('Error accepting offer:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to accept offer',
    });
  }
};
