import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users, fixxerProfiles, reviews, bookings, tasks } from '@db/schema';
import { eq, desc, count, and } from 'drizzle-orm';

/**
 * Get a fixxer's public profile
 * This includes their basic info, stats, completed works, and reviews (anonymous)
 */
const getFixxerPublicProfile = async (req: Request, res: Response) => {
  try {
    const { fixxerId } = req.params;

    if (!fixxerId) {
      res.status(400).json({
        status: 'error',
        message: 'Fixxer ID is required',
      });
      return;
    }

    // Get fixxer basic info
    const fixxer = await db.query.users.findFirst({
      where: eq(users.id, fixxerId),
      columns: {
        id: true,
        name: true,
        username: true,
        profileUrl: true,
        createdAt: true,
      },
    });

    if (!fixxer) {
      res.status(404).json({
        status: 'error',
        message: 'Fixxer not found',
      });
      return;
    }

    // Get fixxer profile stats (may not exist)
    const fixxerProfile = await db.query.fixxerProfiles.findFirst({
      where: eq(fixxerProfiles.userId, fixxerId),
    });

    // Count completed bookings directly (more reliable than stored count)
    const [completedCountResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(
        and(eq(bookings.fixxerId, fixxerId), eq(bookings.status, 'completed')),
      );
    const completedTasksCount = completedCountResult?.count || 0;

    // Get completed works (tasks where this fixxer was assigned and completed)
    const completedWorks = await db
      .select({
        id: tasks.id,
        taskTitle: tasks.taskTitle,
        completedAt: tasks.completedAt,
        categoryId: tasks.categoryId,
      })
      .from(bookings)
      .innerJoin(tasks, eq(bookings.taskId, tasks.id))
      .where(
        and(eq(bookings.fixxerId, fixxerId), eq(bookings.status, 'completed')),
      )
      .orderBy(desc(tasks.completedAt))
      .limit(10);

    // Get reviews (anonymous - don't include client info)
    const fixxerReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        // Anonymous: only include task title, not client info
        taskTitle: tasks.taskTitle,
        categoryId: tasks.categoryId,
      })
      .from(reviews)
      .innerJoin(bookings, eq(reviews.bookingId, bookings.id))
      .innerJoin(tasks, eq(bookings.taskId, tasks.id))
      .where(eq(reviews.fixxerId, fixxerId))
      .orderBy(desc(reviews.createdAt))
      .limit(20);

    // Get total review count
    const [reviewCountResult] = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.fixxerId, fixxerId));

    // Get rating distribution
    const ratingDistribution = await db
      .select({
        rating: reviews.rating,
        count: count(),
      })
      .from(reviews)
      .where(eq(reviews.fixxerId, fixxerId))
      .groupBy(reviews.rating);

    res.status(200).json({
      status: 'ok',
      data: {
        fixxer: {
          ...fixxer,
          memberSince: fixxer.createdAt,
        },
        stats: {
          completedTasksCount: completedTasksCount,
          averageRating: fixxerProfile?.averageRating || null,
          totalReviews: reviewCountResult?.count || 0,
          isAvailable: fixxerProfile?.isAvailable ?? true,
        },
        ratingDistribution: ratingDistribution.reduce(
          (acc, item) => {
            acc[item.rating] = item.count;
            return acc;
          },
          { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as Record<string, number>,
        ),
        completedWorks,
        reviews: fixxerReviews,
      },
    });
  } catch (error) {
    console.error('Error fetching fixxer profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch fixxer profile',
    });
  }
};

export default getFixxerPublicProfile;
