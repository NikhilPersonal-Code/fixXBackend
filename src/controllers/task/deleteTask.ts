import { Response } from 'express';
import db from '@config/dbConfig';
import { tasks, offers, bookings, taskImages } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';
import { deleteFromCloudinary } from '@/middleware/upload';

/**
 * Delete a task (only if posted and no accepted offers)
 * Only the task creator can delete their task
 */
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const taskId = req.params.id;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    // Get the task
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) {
      res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
      return;
    }

    // Check if user is the task owner
    if (task.clientId !== userId) {
      res.status(403).json({
        status: 'error',
        message: 'You can only delete your own tasks',
      });
      return;
    }

    // Check if task can be deleted (only posted status and no accepted offers)
    if (
      task.status !== 'posted' &&
      task.status !== 'completed' &&
      task.status !== 'cancelled'
    ) {
      res.status(400).json({
        status: 'error',
        message:
          'Only posted tasks,completed cancelled can be deleted. Please cancel the task instead.',
      });
      return;
    }

    // Check if there are any accepted offers or bookings
    const existingBooking = await db.query.bookings.findFirst({
      where: eq(bookings.taskId, taskId),
    });

    if (existingBooking && task.status === 'posted') {
      res.status(400).json({
        status: 'error',
        message:
          'Cannot delete task with accepted offers. Please cancel the task instead.',
      });
      return;
    }
    // Delete all booking first
    await db.delete(bookings).where(eq(bookings.taskId, taskId));

    // Delete all pending offers first
    await db.delete(offers).where(eq(offers.taskId, taskId));

    // Delete the task
    await db.delete(tasks).where(eq(tasks.id, taskId));

    const urls = await db
      .delete(taskImages)
      .where(eq(taskImages.taskId, taskId))
      .returning({ imageUrl: taskImages.imageUrl });

    for (let i = 0; i < urls.length; i++) {
      await deleteFromCloudinary(urls[i].imageUrl);
    }

    res.status(200).json({
      status: 'ok',
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete task',
    });
  }
};

export default deleteTask;
