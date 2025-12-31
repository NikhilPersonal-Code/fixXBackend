import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { offers, users } from '@db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthRequest } from '@/types';

/**
 * Get all offers for a specific task
 * This endpoint is used by the client (task owner) to view offers made on their task
 */
const getTaskOffers = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id; // Route param is :id not :taskId
    const userId = req.user?.userId;

    if (!taskId) {
      res.status(400).json({
        status: 'error',
        message: 'Task ID is required',
      });
      return;
    }

    // Fetch offers with fixxer details
    const taskOffers = await db
      .select({
        id: offers.id,
        price: offers.price,
        message: offers.message,
        estimatedDuration: offers.estimatedDuration,
        status: offers.status,
        createdAt: offers.createdAt,
        fixxer: {
          id: users.id,
          name: users.name,
          profileUrl: users.profileUrl,
          username: users.username,
        },
      })
      .from(offers)
      .leftJoin(users, eq(offers.fixxerId, users.id))
      .where(eq(offers.taskId, taskId))
      .orderBy(desc(offers.createdAt));

    res.status(200).json({
      status: 'ok',
      data: taskOffers,
    });
  } catch (error) {
    console.error('Error fetching task offers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch offers',
    });
  }
};

export default getTaskOffers;
