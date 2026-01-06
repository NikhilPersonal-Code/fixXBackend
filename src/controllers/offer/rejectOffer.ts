import { Response } from 'express';
import db from '@config/dbConfig';
import { offers, tasks, users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';
import { sendPushNotification } from '@utils/pushNotification';

/**
 * Reject an offer (Client only)
 */
export const rejectOffer = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.userId;
    const { offerId } = req.params;

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
        message: 'You are not authorized to reject this offer',
      });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `This offer has already been ${offer.status}`,
      });
    }

    // Update offer status to rejected
    const [rejectedOffer] = await db
      .update(offers)
      .set({
        status: 'rejected',
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(offers.id, offerId))
      .returning();

    // Get fixxer info for notification
    const fixxer = await db.query.users.findFirst({
      where: eq(users.id, offer.fixxerId),
    });

    // Get client info
    const client = await db.query.users.findFirst({
      where: eq(users.id, clientId),
    });

    // Send push notification to fixxer
    if (fixxer?.fcmToken) {
      await sendPushNotification(
        fixxer.fcmToken,
        'Offer Not Accepted',
        `${client?.name || 'The client'} has decided to go with another offer for "${offer.task.taskTitle}".`,
        { taskId: offer.taskId, type: 'offer_rejected' },
      );
    }

    return res.json({
      status: 'ok',
      message: 'Offer rejected successfully',
      data: rejectedOffer,
    });
  } catch (error: any) {
    console.error('Error rejecting offer:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to reject offer',
    });
  }
};
