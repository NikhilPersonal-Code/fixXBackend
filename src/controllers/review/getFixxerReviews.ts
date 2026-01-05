import { Response } from 'express';
import db from '@config/dbConfig';
import { reviews } from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/common';

/**
 * Get all reviews for a fixxer
 */
const getFixxerReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { fixxerId } = req.params;

    const fixxerReviews = await db.query.reviews.findMany({
      where: eq(reviews.fixxerId, fixxerId),
      with: {
        client: {
          columns: {
            id: true,
            name: true,
            profileUrl: true,
          },
        },
        booking: {
          with: {
            task: {
              columns: {
                id: true,
                taskTitle: true,
              },
            },
          },
        },
      },
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
    });

    res.status(200).json({
      status: 'ok',
      data: fixxerReviews,
    });
  } catch (error) {
    console.error('Error fetching fixxer reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reviews',
    });
  }
};

export default getFixxerReviews;
