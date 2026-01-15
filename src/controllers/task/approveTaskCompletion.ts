import { Response } from 'express';
import db from '@config/dbConfig';
import {
  tasks,
  bookings,
  fixxerProfiles,
  users,
  taskTimeline,
} from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';
import { sendPushNotification } from '@utils/pushNotification';

/**
 * Approve task completion (Client approves fixxer's completion request)
 * This finalizes the task as completed
 */
export const approveTaskCompletion = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    const { id: taskId } = req.params;

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

    // Only client can approve completion
    const isClient = task.clientId === userId;

    if (!isClient) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the client can approve task completion',
      });
    }

    // Task must be pending_completion
    if (task.status !== 'pending_completion') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot approve completion for task with status: ${task.status}`,
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

    // Add completed event in the task timeline
    await db.insert(taskTimeline).values({
      taskId: task.id,
      completedAt: now,
      status: 'completed',
    });

    // Update task status to completed
    const [completedTask] = await db
      .update(tasks)
      .set({
        status: 'completed',
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

      // Notify fixxer about approval
      const fixxer = await db.query.users.findFirst({
        where: eq(users.id, task.assignedFixxerId),
      });

      const client = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (fixxer?.fcmToken) {
        await sendPushNotification(
          fixxer.fcmToken,
          'Task Completed! 🎉',
          `${client?.name || 'The client'} has approved the completion of "${task.taskTitle}". Great job!`,
          {
            taskId,
            bookingId: booking.id,
            type: 'completion_approved',
            recipientRole: 'fixxer',
          },
        );
      }
    }

    return res.json({
      status: 'ok',
      message: 'Task completion approved successfully',
      data: {
        task: completedTask,
        booking: {
          id: booking.id,
          status: 'completed',
        },
      },
    });
  } catch (error: any) {
    console.error('Error approving task completion:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to approve task completion',
    });
  }
};
