import { Request, Response } from 'express';
import { users } from '@db/tables';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types';
import db from '@/config/dbConfig';

// TODO: remove try catch from all controllers start throwing Error

export const sendPhoneOtp = async (req: AuthRequest, res: Response) => {
  // const { phoneNumber } = req.body;
  let phoneNumber: string | undefined = '11342';

  res.status(200).json({
    status: 'success',
    message: 'OTP sent successfully (Mock)',

    data: {
      mockOtp: '123456',
    },
  });
};

export const verifyPhoneOtp = async (req: AuthRequest, res: Response) => {
  const { phoneNumber, otp } = req.body;
  const userId = req.user?.userId; // Assuming auth middleware populates this

  if (!phoneNumber || !otp) {
    throw new Error('Phone number and OTP are required');
  }

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Mock implementation: Check if OTP is '123456'
  if (otp !== '123456') {
    throw new Error('Invalid OTP');
  }

  // Update user verification status
  const [updatedUser] = await db
    .update(users)
    .set({
      isPhoneVerified: true,
      phoneNumber: phoneNumber,
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser) {
    throw new Error('User not found');
  }

  res.status(200).json({
    status: 'success',
    message: 'Phone number verified successfully',
    data: {
      user: updatedUser,
    },
  });
};
