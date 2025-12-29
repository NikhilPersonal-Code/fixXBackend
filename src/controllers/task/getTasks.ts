import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { tasks, categories, users } from '@db/tables';
import { eq, desc, and, SQL } from 'drizzle-orm';
import { taskStatusEnum, type TaskStatus } from '@/db/enums';

// Get all tasks (for notifications/feed)
export const getTasks = async (req: Request, res: Response) => {
  try {
    // TODO: Implement Pagination In The Frontend
    const { limit = 20, offset = 0, categoryId, status } = req.query;

    const whereConditions: SQL[] = [];

    if (categoryId) {
      whereConditions.push(eq(tasks.categoryId, categoryId as string));
    }

    if (status) {
      whereConditions.push(eq(tasks.status, status as TaskStatus));
    } else {
      // By default, only show posted tasks
      whereConditions.push(eq(tasks.status, 'posted'));
    }

    const taskList = await db
      .select({
        id: tasks.id,
        taskTitle: tasks.taskTitle,
        taskDescription: tasks.taskDescription,
        taskLocation: tasks.taskLocation,
        locationAddress: tasks.locationAddress,
        budget: tasks.budget,
        isAsap: tasks.isAsap,
        status: tasks.status,
        offerCount: tasks.offerCount,
        createdAt: tasks.createdAt,
        categoryName: categories.categoryName,
        clientName: users.name,
        clientProfileUrl: users.profileUrl,
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .leftJoin(users, eq(tasks.clientId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(tasks.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    return res.json({
      status: 'ok',
      data: taskList,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch tasks',
    });
  }
};
