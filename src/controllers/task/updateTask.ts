import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { tasks } from '@db/tables';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';

// Update task
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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
