import { Response } from 'express';
import db from '@config/dbConfig';
import { tasks, categories, users } from '@db/tables';
import { eq, desc, and, ne } from 'drizzle-orm';
import { AuthRequest } from '@/types';

// Get latest tasks (for notifications)
export const getLatestTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    // For resolving typescript error used or operator.
    const userId = req.user?.userId || '';

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
        voiceInstructionUrl: tasks.voiceInstructionUrl || null,
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .leftJoin(users, eq(tasks.clientId, users.id))
      .where(and(eq(tasks.status, 'posted'), ne(tasks.clientId, userId)))
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
