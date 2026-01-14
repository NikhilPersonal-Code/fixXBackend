import { Response } from 'express';
import db from '@config/dbConfig';
import { tasks, users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';
import { sendPushNotification } from '@utils/pushNotification';

/**
 * Reject task completion (Client rejects fixxer's completion request)
 * This sends the task back to in_progress status
 */
export const rejectTaskCompletion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id: taskId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Validate rejection reason
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required',
      });
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

    // Only client can reject completion
    const isClient = task.clientId === userId;

    if (!isClient) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the client can reject task completion',
      });
    }

    // Task must be pending_completion
    if (task.status !== 'pending_completion') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot reject completion for task with status: ${task.status}`,
      });
    }

    const now = new Date();

    // Update task status back to in_progress with rejection reason
    const [updatedTask] = await db
      .update(tasks)
      .set({
        status: 'in_progress',
        completionRejectionReason: reason.trim(),
        completionRequestedBy: null,
        completionRequestedAt: null,
        updatedAt: now,
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Notify fixxer about rejection
    if (task.assignedFixxerId) {
      const fixxer = await db.query.users.findFirst({
        where: eq(users.id, task.assignedFixxerId),
      });

      const client = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (fixxer?.fcmToken) {
        await sendPushNotification(
          fixxer.fcmToken,
          'Completion Request Rejected',
          `${client?.name || 'The client'} has rejected the completion request for "${task.taskTitle}". Reason: ${reason}`,
          {
            taskId,
            reason,
            type: 'completion_rejected',
            recipientRole: 'fixxer',
          },
        );
      }
    }

    return res.json({
      status: 'ok',
      message: 'Task completion rejected. Task is back in progress.',
      data: {
        task: updatedTask,
      },
    });
  } catch (error: any) {
    console.error('Error rejecting task completion:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to reject task completion',
    });
  }
};
