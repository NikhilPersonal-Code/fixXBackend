// import { Request, Response } from 'express';
// import crypto from 'crypto';
// import db from '@/config/dbConfig';
// import { transactions, users } from '@/db/tables';
// import { eq } from 'drizzle-orm';

// export const verifyPayment = async (req: Request, res: Response) => {
//   try {
//     const { order_id, razorpay_payment_id, razorpay_signature } = req.body;
//     // const orderId = db.select().from(users);
//     const secret = process.env.RAZORPAY_SECRET || '';

//     const generatedSignature = crypto
//       .createHmac('sha256', secret)
//       .update(order_id + '|' + razorpay_payment_id)
//       .digest('hex');

//     if (razorpay_signature === generatedSignature) {
//       // Update database for the successful payment mark the task actually done.
//       await db
//         .update(transactions)
//         .set({
//           status: 'completed',
//         })
//         .where(eq(transactions.orderId, order_id));
//       return res
//         .json({
//           success: true,
//           message: 'Payment successful',
//         })
//         .status(200);
//     }
//     return res
//       .json({
//         success: false,
//         message: 'Payment not successful',
//       })
//       .status(200);
//   } catch (error) {
//     console.log('Error occured at verifyPayment() :: ' + error);
//     return res
//       .json({
//         success: false,
//         message: 'Internal server ocurred',
//       })
//       .status(500);
//   }
// };
