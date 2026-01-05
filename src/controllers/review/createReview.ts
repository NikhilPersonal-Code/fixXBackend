import { Response } from 'express';
import db from '@config/dbConfig';
import { reviews, bookings, fixxerProfiles } from '@db/schema';
import { eq, sql } from 'drizzle-orm';
import { AuthRequest } from '@/types/common';

/**
 * Create a review for a completed task
 * Only the client can leave a review for the fixxer
 */
const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { bookingId, rating, comment } = req.body;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    if (!bookingId || !rating) {
      res.status(400).json({
        status: 'error',
        message: 'Booking ID and rating are required',
      });
      return;
    }

    // Validate rating is between 1 and 5
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5',
      });
      return;
    }

    // Get the booking
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        task: true,
      },
    });

    if (!booking) {
      res.status(404).json({
        status: 'error',
        message: 'Booking not found',
      });
      return;
    }

    // Check if user is the client for this booking
    if (booking.clientId !== userId) {
      res.status(403).json({
        status: 'error',
        message: 'Only the client can leave a review',
      });
      return;
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      res.status(400).json({
        status: 'error',
        message: 'Can only review completed tasks',
      });
      return;
    }

    // Check if review already exists
    const existingReview = await db.query.reviews.findFirst({
      where: eq(reviews.bookingId, bookingId),
    });

    if (existingReview) {
      res.status(400).json({
        status: 'error',
        message: 'Review already exists for this booking',
      });
      return;
    }

    // Create the review
    const [newReview] = await db
      .insert(reviews)
      .values({
        bookingId,
        clientId: userId,
        fixxerId: booking.fixxerId,
        rating: ratingNum.toString() as '1' | '2' | '3' | '4' | '5',
        comment: comment?.trim() || null,
      })
      .returning();

    // Update fixxer's average rating
    const fixxerReviews = await db
      .select({
        avgRating: sql<number>`AVG(CAST(${reviews.rating} AS TEXT)::INTEGER)`,
      })
      .from(reviews)
      .where(eq(reviews.fixxerId, booking.fixxerId));

    const avgRating = Number(fixxerReviews[0]?.avgRating) || ratingNum;

    // Update fixxer profile with new average rating
    await db
      .update(fixxerProfiles)
      .set({
        averageRating: avgRating.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(fixxerProfiles.userId, booking.fixxerId));

    res.status(201).json({
      status: 'ok',
      message: 'Review submitted successfully',
      data: newReview,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit review',
    });
  }
};

export default createReview;
