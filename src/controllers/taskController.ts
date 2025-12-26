import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { tasks, categories, users } from '@db/tables';
import { eq, desc, and, sql } from 'drizzle-orm';

// Create a new task
export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized - No user ID in token' });
    }

    const {
      categoryId,
      taskTitle,
      taskDescription,
      taskLocation,
      locationAddress,
      budget,
      isAsap,
      scheduledAt,
      mustHaveItems,
      voiceInstructionUrl,
      priceType,
      openToOffer,
      typeOfTask,
    } = req.body;

    // Validate required fields
    if (
      !categoryId ||
      !taskTitle ||
      !taskDescription ||
      !taskLocation ||
      !budget
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'Missing required fields: categoryId, taskTitle, taskDescription, taskLocation, and budget are required',
      });
    }

    // Validate task title length (min 10 chars as per DB constraint)
    if (taskTitle.length < 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Task title must be at least 10 characters',
      });
    }

    // Validate description length (min 25 chars as per DB constraint)
    if (taskDescription.length < 25) {
      return res.status(400).json({
        status: 'error',
        message: 'Task description must be at least 25 characters',
      });
    }

    // Validate budget is positive
    if (Number(budget) <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Budget must be a positive number',
      });
    }

    // Validate taskLocation format
    if (!taskLocation.x || !taskLocation.y) {
      return res.status(400).json({
        status: 'error',
        message:
          'taskLocation must have x (longitude) and y (latitude) properties',
      });
    }

    // Verify category exists
    const categoryExists = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!categoryExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid category ID',
      });
    }

    // Create the task
    const [newTask] = await db
      .insert(tasks)
      .values({
        clientId: userId,
        categoryId,
        taskTitle,
        taskDescription,
        taskLocation: { x: taskLocation.x, y: taskLocation.y },
        locationAddress: locationAddress || null,
        budget: budget.toString(),
        isAsap: isAsap || false,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        mustHaveItems: mustHaveItems || null,
        voiceInstructionUrl: voiceInstructionUrl || null,
        priceType: priceType || 'total',
        openToOffer: openToOffer || false,
        typeOfTask: typeOfTask || 'in_person',
        status: 'posted',
      })
      .returning();

    return res.status(201).json({
      status: 'ok',
      message: 'Task created successfully',
      data: newTask,
    });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create task',
    });
  }
};

// Get all tasks (for notifications/feed)
export const getTasks = async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0, categoryId, status } = req.query;

    let whereConditions = [];

    if (categoryId) {
      whereConditions.push(eq(tasks.categoryId, categoryId as string));
    }

    if (status) {
      whereConditions.push(eq(tasks.status, status as any));
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
        clientName: users.name,
        clientProfileUrl: users.profileUrl,
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

// Get user's own tasks
export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const { status } = req.query;

    let whereConditions = [eq(tasks.clientId, userId)];

    if (status) {
      whereConditions.push(eq(tasks.status, status as any));
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

// Update task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Check if task exists and belongs to user
    const existingTask = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.clientId, userId)),
    });

    if (!existingTask) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or you do not have permission to update it',
      });
    }

    // Only allow updates if task is still in draft or posted status
    if (!['draft', 'posted'].includes(existingTask.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update task that is already assigned or completed',
      });
    }

    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData.id;
    delete updateData.clientId;
    delete updateData.createdAt;

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    return res.json({
      status: 'ok',
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update task',
    });
  }
};

// Cancel task
export const cancelTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Check if task exists and belongs to user
    const existingTask = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.clientId, userId)),
    });

    if (!existingTask) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or you do not have permission to cancel it',
      });
    }

    // Only allow cancellation if task is not already completed or cancelled
    if (['completed', 'cancelled'].includes(existingTask.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel task that is already completed or cancelled',
      });
    }

    const [cancelledTask] = await db
      .update(tasks)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason || null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    return res.json({
      status: 'ok',
      message: 'Task cancelled successfully',
      data: cancelledTask,
    });
  } catch (error: any) {
    console.error('Error cancelling task:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to cancel task',
    });
  }
};
