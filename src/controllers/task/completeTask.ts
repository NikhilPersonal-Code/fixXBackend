import { Response } from 'express';
import db from '@config/dbConfig';
import { tasks, bookings, users, fixxerProfiles,taskTimeline } from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';
import { sendPushNotification } from '@utils/pushNotification';

/**
 * Request task completion (Fixxer marks task as complete)
 * This sets status to 'pending_completion' and notifies client
 */
export const completeTask = async (req: AuthRequest, res: Response) => {
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

    // Only fixxer can request completion
    const isFixxer = task.assignedFixxerId === userId;

    if (!isFixxer) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the assigned fixxer can request task completion',
      });
    }

    // Task must be in_progress to request completion
    if (task.status !== 'in_progress') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot complete task with status: ${task.status}`,
      });
    }

    const now = new Date();

    // Add Completion Request From Fixxer To Client event in the task timeline
    await db.insert(taskTimeline).values({
      taskId: task.id,
      status: 'pending_completion',
      completionRequestedBy: userId,
      completionRequestedAt: now,
    });

    // Update task status to pending_completion
    const [updatedTask] = await db
      .update(tasks)
      .set({
        status: 'pending_completion',
        updatedAt: now,
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Get client and fixxer info for notifications
    const client = await db.query.users.findFirst({
      where: eq(users.id, task.clientId),
    });

    const fixxer = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Notify client about completion request
    if (client?.fcmToken) {
      await sendPushNotification(
        client.fcmToken,
        'Task Completion Request',
        `${fixxer?.name || 'Your Fixxer'} has marked the task "${task.taskTitle}" as completed. Please review and approve.`,
        {
          taskId,
          type: 'completion_requested',
          recipientRole: 'client',
        },
      );
    }

    return res.json({
      status: 'ok',
      message: 'Task completion request sent to client',
      data: {
        task: updatedTask,
      },
    });
  } catch (error: any) {
    console.error('Error requesting task completion:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to request task completion',
    });
  }
};
