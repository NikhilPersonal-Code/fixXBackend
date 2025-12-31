import { Response } from 'express';
import db from '@config/dbConfig';
import { offers, tasks } from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/common';

/**
 * Withdraw an offer (Fixxer only)
 */
export const withdrawOffer = async (req: AuthRequest, res: Response) => {
  try {
    const fixxerId = req.user?.userId;
    const { offerId } = req.params;

    if (!fixxerId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Get the offer
    const offer = await db.query.offers.findFirst({
      where: eq(offers.id, offerId),
    });

    if (!offer) {
      return res.status(404).json({
        status: 'error',
        message: 'Offer not found',
      });
    }

    // Verify fixxer owns the offer
    if (offer.fixxerId !== fixxerId) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to withdraw this offer',
      });
    }

    // Check if offer is still pending
    // TODO:  why not withdraw accepted offers we will see this later ?
    if (offer.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot withdraw an offer that has been ${offer.status}`,
      });
    }

    // Update offer status to withdrawn
    const [withdrawnOffer] = await db
      .update(offers)
      .set({
        status: 'withdrawn',
        updatedAt: new Date(),
      })
      .where(eq(offers.id, offerId))
      .returning();

    // Decrease task offer count
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, offer.taskId),
    });

    if (task && task.offerCount > 0) {
      await db
        .update(tasks)
        .set({
          offerCount: task.offerCount - 1,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, offer.taskId));
    }

    return res.json({
      status: 'ok',
      message: 'Offer withdrawn successfully',
      data: withdrawnOffer,
    });
  } catch (error: any) {
    console.error('Error withdrawing offer:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to withdraw offer',
    });
  }
};
