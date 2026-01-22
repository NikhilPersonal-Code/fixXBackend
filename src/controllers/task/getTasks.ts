import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { tasks, categories, users } from '@db/tables';
import { eq, desc, and, SQL, or, ne } from 'drizzle-orm';
import { taskStatusEnum, type TaskStatus } from '@/db/enums';
import { withinRadius } from '@utils/spatial';

// Get all tasks (for notifications/feed)
export const getTasks = async (req: Request, res: Response) => {
  try {
    // TODO: Implement Pagination In The Frontend
    const {
      limit = 20,
      offset = 0,
      categoryId,
      status,
      latitude,
      longitude,
      radius,
      typeOfTask,
      showAvailableOnly,
    } = req.query;

    const whereConditions: SQL[] = [];

    // Category filter
    if (categoryId) {
      whereConditions.push(eq(tasks.categoryId, categoryId as string));
    }

    // Location and radius filter
    if (latitude && longitude && radius) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusMeters = parseFloat(radius as string); // Already in meters from frontend

      whereConditions.push(
        withinRadius(tasks.taskLocation, lng, lat, radiusMeters),
      );
    }

    // Type of task filter (in_person, remote, or both)
    if (typeOfTask && typeOfTask !== 'both') {
      const validType = typeOfTask as 'in_person' | 'remote';
      whereConditions.push(eq(tasks.typeOfTask, validType));
    }

    // Status filter - handle showAvailableOnly
    if (showAvailableOnly === 'true') {
      // Only show posted tasks (not assigned yet)
      whereConditions.push(eq(tasks.status, 'posted'));
    } else if (status) {
      // Specific status requested
      whereConditions.push(eq(tasks.status, status as TaskStatus));
    } else {
      // Show all tasks except cancelled
      whereConditions.push(ne(tasks.status, 'cancelled'));
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
        typeOfTask: tasks.typeOfTask,
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
