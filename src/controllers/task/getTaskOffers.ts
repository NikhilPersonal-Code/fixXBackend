import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { offers, users, fixxerProfiles, reviews } from '@db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { AuthRequest } from '@/types';

/**
 * Get all offers for a specific task
 * This endpoint is used by the client (task owner) to view offers made on their task
 * Includes fixxer stats: completed tasks count, average rating, total reviews
 */
const getTaskOffers = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id; // Route param is :id not :taskId
    const userId = req.user?.userId;

    if (!taskId) {
      res.status(400).json({
        status: 'error',
        message: 'Task ID is required',
      });
      return;
    }

    // Fetch offers with fixxer details and profile stats
    const taskOffers = await db
      .select({
        id: offers.id,
        price: offers.price,
        message: offers.message,
        estimatedDuration: offers.estimatedDuration,
        status: offers.status,
        createdAt: offers.createdAt,
        fixxer: {
          id: users.id,
          name: users.name,
          profileUrl: users.profileUrl,
          username: users.username,
        },
        fixxerStats: {
          completedTasksCount: fixxerProfiles.completedTasksCount,
          averageRating: fixxerProfiles.averageRating,
        },
      })
      .from(offers)
      .leftJoin(users, eq(offers.fixxerId, users.id))
      .leftJoin(fixxerProfiles, eq(offers.fixxerId, fixxerProfiles.userId))
      .where(eq(offers.taskId, taskId))
      .orderBy(desc(offers.createdAt));

    // Get review counts for each fixxer
    const fixxerIds = taskOffers
      .map((o) => o.fixxer?.id)
      .filter(Boolean) as string[];

    const reviewCounts =
      fixxerIds.length > 0
        ? await Promise.all(
            fixxerIds.map(async (fixxerId) => {
              const [result] = await db
                .select({ count: count() })
                .from(reviews)
                .where(eq(reviews.fixxerId, fixxerId));
              return { fixxerId, reviewCount: result?.count || 0 };
            }),
          )
        : [];

    // Map review counts to offers
    const offersWithReviewCounts = taskOffers.map((offer) => ({
      ...offer,
      fixxerStats: {
        ...offer.fixxerStats,
        reviewCount:
          reviewCounts.find((r) => r.fixxerId === offer.fixxer?.id)
            ?.reviewCount || 0,
      },
    }));

    res.status(200).json({
      status: 'ok',
      data: offersWithReviewCounts,
    });
  } catch (error) {
    console.error('Error fetching task offers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch offers',
    });
  }
};

export default getTaskOffers;
