import { Response } from 'express';
import db from '@config/dbConfig';
import { tasks, bookings, users, fixxerProfiles } from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';
import { sendPushNotification } from '@utils/pushNotification';

/**
 * Mark task as completed
 * Can be called by either client or fixxer
 */
export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id: taskId } = req.params;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Get task with booking
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
        message: 'You are not authorized to complete this task',
      });
    }

    // Task must be in_progress to be completed
    if (task.status !== 'in_progress') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot complete task with status: ${task.status}`,
      });
    }

    // Get the booking
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.taskId, taskId),
    });

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found for this task',
      });
    }

    const now = new Date();

    // Update task status to completed
    const [completedTask] = await db
      .update(tasks)
      .set({
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Update booking status
    await db
      .update(bookings)
      .set({
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(bookings.id, booking.id));

    // Update fixxer profile stats
    if (task.assignedFixxerId) {
      const fixxerProfile = await db.query.fixxerProfiles.findFirst({
        where: eq(fixxerProfiles.userId, task.assignedFixxerId),
      });

      if (fixxerProfile) {
        await db
          .update(fixxerProfiles)
          .set({
            completedTasksCount: fixxerProfile.completedTasksCount + 1,
            updatedAt: now,
          })
          .where(eq(fixxerProfiles.userId, task.assignedFixxerId));
      }
    }

    // Send notifications
    const client = await db.query.users.findFirst({
      where: eq(users.id, task.clientId),
    });

    const fixxer = task.assignedFixxerId
      ? await db.query.users.findFirst({
          where: eq(users.id, task.assignedFixxerId),
        })
      : null;

    // TODO: Only Client Can Mark The Task as Completed.

    // Notify the other party
    if (isClient && fixxer?.fcmToken) {
      await sendPushNotification(
        fixxer.fcmToken,
        'Task Completed! ✅',
        `${client?.name || 'The client'} has marked the task "${task.taskTitle}" as completed. Great job!`,
        { taskId, bookingId: booking.id, type: 'task_completed' },
      );
    } else if (isFixxer && client?.fcmToken) {
      await sendPushNotification(
        client.fcmToken,
        'Task Completed! ✅',
        `${fixxer?.name || 'Your Fixxer'} has marked the task "${task.taskTitle}" as completed.`,
        { taskId, bookingId: booking.id, type: 'task_completed' },
      );
    }

    return res.json({
      status: 'ok',
      message: 'Task completed successfully',
      data: {
        task: completedTask,
        booking: {
          id: booking.id,
          status: 'completed',
        },
      },
    });
  } catch (error: any) {
    console.error('Error completing task:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to complete task',
    });
  }
};
