// import db from '@/config/dbConfig';
// import { bookings, transactions } from '@/db/tables';
// import { AuthRequest } from '@/types';
// import { eq } from 'drizzle-orm';
// import { Request, Response } from 'express';
// import Razorpay from 'razorpay';

// export const createOrder = async (req: AuthRequest, res: Response) => {
//   try {
//     const razorpay = new Razorpay({
//       key_id: process.env.RAZORPAY_KEY_ID,
//       key_secret: process.env.RAZORPAY_SECRET,
//     });

//     const { bookingId } = req.body;

//     const [booking] = await db
//       .select()
//       .from(bookings)
//       .where(eq(bookings.id, bookingId));

//     const orderResponse = await razorpay.orders.create({
//       amount: booking.agreedPrice || 1 * 100,
//       currency: 'INR',
//       receipt: 'receipt#1',
//       notes: {},
//     });

//     console.log(orderResponse);

//     await db.insert(transactions).values({
//       bookingId: bookingId,
//       amount: booking.agreedPrice,
//       type: 'payment',
//       userId: req.user?.userId || '',
//       status: 'pending',
//       paymentGateway: 'razorpay',
//       orderId: orderResponse.id,
//     });

//     return res.json({
//       status: 'ok',
//       message: 'Order created successfully',
//       data: {
//         orderId: orderResponse.id,
//       },
//     });
//   } catch (error) {
//     console.error('Error Creating order:', error);
//     return res.status(500).json({
//       status: 'error',
//       message: (error as Error).message || 'Failed to accept offer',
//     });
//   }
// };
