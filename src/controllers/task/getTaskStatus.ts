import { Response } from 'express';
import db from '@config/dbConfig';
import {
  tasks,
  bookings,
  offers,
  users,
  categories,
  taskTimeline,
} from '@db/schema';
import { asc, eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';

/**
 * Get task status with full details
 * Returns task state, booking info, and offer info
 */
export const getTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id: taskId } = req.params;

    // Get task with related data
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: {
        category: true,
        client: {
          columns: {
            id: true,
            name: true,
            email: true,
            profileUrl: true,
          },
        },
        assignedFixxer: {
          columns: {
            id: true,
            name: true,
            email: true,
            profileUrl: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }

    // Get booking if exists
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.taskId, taskId),
    });

    // Get accepted offer if exists
    const acceptedOffer = await db.query.offers.findFirst({
      where: eq(offers.taskId, taskId),
      with: {
        fixxer: {
          columns: {
            id: true,
            name: true,
            profileUrl: true,
          },
        },
      },
    });

    // Determine user role in this task
    let userRole = null;
    if (userId) {
      if (task.clientId === userId) {
        userRole = 'client';
      } else if (task.assignedFixxerId === userId) {
        userRole = 'fixxer';
      }
    }

    // Build status timeline
    const timeline = [];

    timeline.push({
      status: 'posted',
      label: 'Task Posted',
      timestamp: task.createdAt,
      completed: true,
    });

    if (booking?.createdAt) {
      timeline.push({
        status: 'assigned',
        label: 'Offer Accepted',
        timestamp: booking?.createdAt || null,
        completed: true,
      });
    }

    if (booking?.startedAt) {
      timeline.push({
        status: 'in_progress',
        label: 'Work Started',
        timestamp: booking?.startedAt || null,
        completed: true,
      });
    }

    const timelinesEvents = await db
      .select()
      .from(taskTimeline)
      .where(eq(taskTimeline.taskId, task.id))
      .orderBy(asc(taskTimeline.createdAt));

    timelinesEvents.forEach((event, index) => {
      // Show completion rejection in timeline if task was rejected and is back in progress
      if (event.status === 'in_progress' && event.completionRejectionReason) {
        timeline.push({
          status: 'completion_rejected',
          label: 'Completion Rejected',
          timestamp: event.rejectedAt,
          completed: true,
          reason: event.completionRejectionReason,
        });
      }

      if (['pending_completion'].includes(event.status)) {
        timeline.push({
          status: 'pending_completion',
          label: 'Completion Requested',
          timestamp: event.completionRequestedAt,
          completed: true,
        });
      }

      if (index === timelinesEvents.length - 1) {
        if (task.status === 'completed') {
          timeline.push({
            status: 'completed',
            label: 'Task Completed',
            timestamp: event.completedAt,
            completed: true,
          });
        }

        if (task.status === 'cancelled') {
          timeline.push({
            status: 'cancelled',
            label: 'Task Cancelled',
            timestamp: event.cancelledAt,
            completed: true,
            reason: event.cancellationReason || booking?.cancellationReason,
          });
        }
      }
    });

    // Available actions based on current status and user role
    const availableActions = [];

    if (userRole === 'client') {
      if (task.status === 'posted') {
        availableActions.push('view_offers', 'cancel_task', 'edit_task');
      } else if (task.status === 'in_progress') {
        availableActions.push('cancel_task', 'message_fixxer');
      } else if (task.status === 'pending_completion') {
        availableActions.push(
          'approve_completion',
          'reject_completion',
          'message_fixxer',
        );
      } else if (task.status === 'completed') {
        availableActions.push('leave_review');
      }
    } else if (userRole === 'fixxer') {
      if (task.status === 'in_progress') {
        availableActions.push('cancel_task', 'complete_task', 'message_client');
      } else if (task.status === 'pending_completion') {
        availableActions.push('message_client');
      } else if (task.status === 'completed') {
        availableActions.push('view_review');
      }
    }

    return res.json({
      status: 'ok',
      data: {
        task: {
          id: task.id,
          taskTitle: task.taskTitle,
          taskDescription: task.taskDescription,
          location: task.taskLocation,
          locationAddress: task.locationAddress,
          budget: task.budget,
          priceType: task.priceType,
          typeOfTask: task.typeOfTask,
          isAsap: task.isAsap,
          scheduledAt: task.scheduledAt,
          status: task.status,
          offerCount: task.offerCount,
          createdAt: task.createdAt,
        },
        category: task.category,
        client: task.client,
        fixxer: task.assignedFixxer,
        booking: booking
          ? {
              id: booking.id,
              agreedPrice: booking.agreedPrice,
              status: booking.status,
              startedAt: booking.startedAt,
              completedAt: booking.completedAt,
              cancelledAt: booking.cancelledAt,
            }
          : null,
        acceptedOffer: acceptedOffer
          ? {
              id: acceptedOffer.id,
              price: acceptedOffer.price,
              message: acceptedOffer.message,
              estimatedDuration: acceptedOffer.estimatedDuration,
            }
          : null,
        timeline,
        userRole,
        availableActions,
      },
    });
  } catch (error: any) {
    console.error('Error getting task status:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get task status',
    });
  }
};
