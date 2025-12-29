import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { tasks, categories, users } from '@db/tables';
import { eq } from 'drizzle-orm';

// Get task by ID
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await db
      .select({
        id: tasks.id,
        taskTitle: tasks.taskTitle,
        taskDescription: tasks.taskDescription,
        taskLocation: tasks.taskLocation,
        locationAddress: tasks.locationAddress,
        budget: tasks.budget,
        isAsap: tasks.isAsap,
        scheduledAt: tasks.scheduledAt,
        mustHaveItems: tasks.mustHaveItems,
        priceType: tasks.priceType,
        openToOffer: tasks.openToOffer,
        typeOfTask: tasks.typeOfTask,
        status: tasks.status,
        offerCount: tasks.offerCount,
        createdAt: tasks.createdAt,
        categoryId: tasks.categoryId,
        categoryName: categories.categoryName,
        clientId: tasks.clientId,
        clientName: users.name,
        clientProfileUrl: users.profileUrl,
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .leftJoin(users, eq(tasks.clientId, users.id))
      .where(eq(tasks.id, id))
      .limit(1);

    if (!task.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }

    return res.json({
      status: 'ok',
      data: task[0],
    });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch task',
    });
  }
};
