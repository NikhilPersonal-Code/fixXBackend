import { Response } from 'express';
import db from '@config/dbConfig';
import { tasks, categories, users } from '@db/tables';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';

// Get tasks assigned to the current fixxer
export const getFixxerAssignedTasks = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const assignedTasks = await db
      .select({
        id: tasks.id,
        clientId: tasks.clientId,
        taskTitle: tasks.taskTitle,
        taskDescription: tasks.taskDescription,
        locationAddress: tasks.locationAddress,
        budget: tasks.budget,
        isAsap: tasks.isAsap,
        status: tasks.status,
        createdAt: tasks.createdAt,
        categoryName: categories.categoryName,
        categoryIcon: categories.iconUrl,
        clientName: users.name,
        clientProfileUrl: users.profileUrl,
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .leftJoin(users, eq(tasks.clientId, users.id))
      .where(
        and(
          eq(tasks.assignedFixxerId, userId),
          isNotNull(tasks.assignedFixxerId),
        ),
      )
      .orderBy(desc(tasks.createdAt));

    return res.json({
      status: 'ok',
      data: assignedTasks,
    });
  } catch (error: any) {
    console.error('Error fetching fixxer assigned tasks:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch assigned tasks',
    });
  }
};
