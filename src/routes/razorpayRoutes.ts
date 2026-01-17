import { Router } from 'express';
// import { createOrder, verifyPayment } from '@controllers/razorpay';
import verifyToken from '@middleware/auth';

const router = Router();

// TODO: create a error handler and make the barrel imports for all routes there.

// All offer routes require authentication
// router.use(verifyToken);

// Fixxer routes
// router.post('/create-order', createOrder); // Create a new order
// router.post('/verify-payment', verifyPayment); // Create a new order

export default router;
