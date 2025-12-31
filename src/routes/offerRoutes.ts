import { Router } from 'express';
import {
  createOffer,
  acceptOffer,
  rejectOffer,
  withdrawOffer,
  getMyOffers,
} from '@controllers/offer';
import verifyToken from '@middleware/auth';

const router = Router();

// All offer routes require authentication
router.use(verifyToken);

// Fixxer routes
router.post('/', createOffer); // Create a new offer for a task
router.get('/my', getMyOffers); // Get all offers made by current fixxer
router.post('/:offerId/withdraw', withdrawOffer); // Withdraw an offer

// Client routes
router.post('/:offerId/accept', acceptOffer); // Accept an offer
router.post('/:offerId/reject', rejectOffer); // Reject an offer

export default router;
