import { Response } from 'express';
import db from '@config/dbConfig';
import { fixxerProfiles } from '@db/schema';
import { eq, sql } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';

/**
 * Purchase FixBits (Mock Implementation)
 */
export const purchaseFixBits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { amount, cost, couponCode } = req.body;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid amount',
      });
    }

    // Get fixxer profile
    const profile = await db.query.fixxerProfiles.findFirst({
      where: eq(fixxerProfiles.userId, userId),
    });

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Fixxer profile not found',
      });
    }

    // Update FixBits balance
    await db
      .update(fixxerProfiles)
      .set({
        fixBits: sql`${fixxerProfiles.fixBits} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(fixxerProfiles.userId, userId));

    return res.json({
      status: 'ok',
      message: `${amount} FixBits added successfully!`,
      data: {
        receivedBits: amount,
        costPaid: cost, // purely for echoing back in this mock
        discountUsed: couponCode || null,
      },
    });
  } catch (error: any) {
    console.error('Error purchasing fixbits:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to purchase FixBits',
    });
  }
};
