import { Router } from 'express';
import {
  createReview,
  getReviewByBooking,
  getFixxerReviews,
} from '@controllers/review';
import verifyToken from '@middleware/auth';

const router = Router();

// Protected routes (require authentication)
router.post('/', verifyToken, createReview); // Create a review
router.get('/booking/:bookingId', verifyToken, getReviewByBooking); // Get review by booking ID
router.get('/fixxer/:fixxerId', getFixxerReviews); // Get all reviews for a fixxer (public)

export default router;
