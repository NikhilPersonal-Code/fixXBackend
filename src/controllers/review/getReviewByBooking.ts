import { Response } from 'express';
import db from '@config/dbConfig';
import { reviews } from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';

/**
 * Get review by booking ID
 */
const getReviewByBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    const review = await db.query.reviews.findFirst({
      where: eq(reviews.bookingId, bookingId),
      with: {
        client: {
          columns: {
            id: true,
            name: true,
            profileUrl: true,
          },
        },
        fixxer: {
          columns: {
            id: true,
            name: true,
            profileUrl: true,
          },
        },
      },
    });

    if (!review) {
      res.status(200).json({
        status: 'ok',
        data: null,
      });
      return;
    }

    res.status(200).json({
      status: 'ok',
      data: review,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch review',
    });
  }
};

export default getReviewByBooking;
