import { Response } from 'express';
import db from '@config/dbConfig';
import { offers, tasks, categories, users } from '@db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';

/**
 * Get all offers made by the authenticated fixxer
 */
export const getMyOffers = async (req: AuthRequest, res: Response) => {
  try {
    const fixxerId = req.user?.userId;
    const { status } = req.query;

    if (!fixxerId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Build query
    let query = db
      .select({
        id: offers.id,
        price: offers.price,
        message: offers.message,
        estimatedDuration: offers.estimatedDuration,
        status: offers.status,
        createdAt: offers.createdAt,
        respondedAt: offers.respondedAt,
        task: {
          id: tasks.id,
          title: tasks.taskTitle,
          description: tasks.taskDescription,
          location: tasks.taskLocation,
          locationAddress: tasks.locationAddress,
          budget: tasks.budget,
          status: tasks.status,
          isAsap: tasks.isAsap,
          scheduledAt: tasks.scheduledAt,
        },
        category: {
          id: categories.id,
          name: categories.categoryName,
          iconUrl: categories.iconUrl,
        },
        client: {
          id: users.id,
          name: users.name,
          profileUrl: users.profileUrl,
        },
      })
      .from(offers)
      .leftJoin(tasks, eq(offers.taskId, tasks.id))
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .leftJoin(users, eq(tasks.clientId, users.id))
      .where(eq(offers.fixxerId, fixxerId))
      .orderBy(desc(offers.createdAt));

    const myOffers = await query;

    // Filter by status if provided
    const filteredOffers = status
      ? myOffers.filter((o) => o.status === status)
      : myOffers;

    return res.json({
      status: 'ok',
      data: filteredOffers,
    });
  } catch (error: any) {
    console.error('Error fetching my offers:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch offers',
    });
  }
};
