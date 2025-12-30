import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { tasks, categories, users } from '@db/tables';
import { eq, desc, and } from 'drizzle-orm';

// Get latest tasks (for notifications)
export const getLatestTasks = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const latestTasks = await db
      .select({
        id: tasks.id,
        taskTitle: tasks.taskTitle,
        taskDescription: tasks.taskDescription,
        locationAddress: tasks.locationAddress,
        budget: tasks.budget,
        isAsap: tasks.isAsap,
        status: tasks.status,
        createdAt: tasks.createdAt,
        categoryName: categories.categoryName,
        categoryIcon: categories.iconUrl,
        clientId: users.id,
        clientName: users.name,
        clientProfileUrl: users.profileUrl,
        openToOffer: tasks.openToOffer || false,
        priceType: tasks.priceType || null,
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .leftJoin(users, eq(tasks.clientId, users.id))
      .where(eq(tasks.status, 'posted'))
      .orderBy(desc(tasks.createdAt))
      .limit(Number(limit));

    return res.json({
      status: 'ok',
      data: latestTasks,
    });
  } catch (error: any) {
    console.error('Error fetching latest tasks:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch latest tasks',
    });
  }
};
