import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { tasks } from '@db/tables';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';

// Cancel task
export const cancelTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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
