import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { tasks, categories } from '@db/tables';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/common';
import { sendPushToAllExcept } from '@utils/pushNotification';

// Create a new task
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized - No user ID in token',
      });
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
        // TODO: take must have items in the task Frontend.
        mustHaveItems: mustHaveItems || null,
        voiceInstructionUrl: voiceInstructionUrl || null,
        priceType: priceType || 'total',
        openToOffer: openToOffer || false,
        typeOfTask: typeOfTask || 'in_person',
        status: 'posted',
      })
      .returning();

    // Send push notification to all users except task owner
    await sendPushToAllExcept(userId, 'New Task Available!', taskTitle, {
      taskId: newTask.id,
    });

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
