import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { tasks, categories } from '@db/tables';
import { and, desc, eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/common';
import { TaskStatus } from '@/db/enums';

// Get user's own tasks
export const getMyTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const { status } = req.query;

    let whereConditions = [eq(tasks.clientId, userId)];

    if (status) {
      whereConditions.push(eq(tasks.status, status as TaskStatus));
    }

    const myTasks = await db
      .select({
        id: tasks.id,
        taskTitle: tasks.taskTitle,
        taskDescription: tasks.taskDescription,
        locationAddress: tasks.locationAddress,
        budget: tasks.budget,
        isAsap: tasks.isAsap,
        status: tasks.status,
        offerCount: tasks.offerCount,
        createdAt: tasks.createdAt,
        categoryName: categories.categoryName,
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(desc(tasks.createdAt));

    return res.json({
      status: 'ok',
      data: myTasks,
    });
  } catch (error: any) {
    console.error('Error fetching user tasks:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch your tasks',
    });
  }
};
