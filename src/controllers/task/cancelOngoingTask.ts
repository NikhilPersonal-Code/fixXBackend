import { Response } from 'express';
import db from '@config/dbConfig';
import { tasks, bookings, users, offers } from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';
import { sendPushNotification } from '@utils/pushNotification';

/**
 * Cancel an ongoing task
 * Can be called by either client or assigned fixxer
 * Has different behaviors based on who cancels
 */
export const cancelOngoingTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id: taskId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Get task
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }

    // Check if user is either client or assigned fixxer
    const isClient = task.clientId === userId;
    const isFixxer = task.assignedFixxerId === userId;

    if (!isClient && !isFixxer) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to cancel this task',
      });
    }

    // Can only cancel if task is in_progress
    if (task.status !== 'in_progress') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot cancel task with status: ${task.status}. Only ongoing tasks can be cancelled.`,
      });
    }

    // Get the booking
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.taskId, taskId),
    });

    const now = new Date();

    // Update task status
    const [cancelledTask] = await db
      .update(tasks)
      .set({
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: reason || null,
        updatedAt: now,
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Update booking if exists
    if (booking) {
      await db
        .update(bookings)
        .set({
          status: 'cancelled',
          cancelledAt: now,
          cancellationReason: reason || null,
          cancelledBy: userId,
          updatedAt: now,
        })
        .where(eq(bookings.id, booking.id));
    }

    // Get user info for notifications
    const client = await db.query.users.findFirst({
      where: eq(users.id, task.clientId),
    });

    const fixxer = task.assignedFixxerId
      ? await db.query.users.findFirst({
          where: eq(users.id, task.assignedFixxerId),
        })
      : null;

    // Send notification to the other party
    const cancelledBy = isClient ? 'Client' : 'Fixxer';
    const cancellerName = isClient ? client?.name : fixxer?.name;

    if (isClient && fixxer?.fcmToken) {
      await sendPushNotification(
        fixxer.fcmToken,
        'Task Cancelled',
        `${cancellerName || 'The client'} has cancelled the task "${task.taskTitle}".${reason ? ` Reason: ${reason}` : ''}`,
        { taskId, type: 'task_cancelled', cancelledBy },
      );
    } else if (isFixxer && client?.fcmToken) {
      await sendPushNotification(
        client.fcmToken,
        'Task Cancelled',
        `${cancellerName || 'Your Fixxer'} has cancelled the task "${task.taskTitle}".${reason ? ` Reason: ${reason}` : ''}`,
        { taskId, type: 'task_cancelled', cancelledBy },
      );
    }

    return res.json({
      status: 'ok',
      message: 'Task cancelled successfully',
      data: {
        task: cancelledTask,
        cancelledBy: isClient ? 'client' : 'fixxer',
      },
    });
  } catch (error: any) {
    console.error('Error cancelling ongoing task:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to cancel task',
    });
  }
};
