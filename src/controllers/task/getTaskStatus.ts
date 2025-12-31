import { Response } from 'express';
import db from '@config/dbConfig';
import { tasks, bookings, offers, users, categories } from '@db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types/common';

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

    if (
      ['assigned', 'in_progress', 'completed', 'cancelled'].includes(
        task.status,
      )
    ) {
      timeline.push({
        status: 'assigned',
        label: 'Offer Accepted',
        timestamp: booking?.createdAt || null,
        completed: true,
      });
    }

    if (['in_progress', 'completed', 'cancelled'].includes(task.status)) {
      timeline.push({
        status: 'in_progress',
        label: 'Work Started',
        timestamp: booking?.startedAt || null,
        completed: true,
      });
    }

    if (task.status === 'completed') {
      timeline.push({
        status: 'completed',
        label: 'Task Completed',
        timestamp: task.completedAt,
        completed: true,
      });
    }

    if (task.status === 'cancelled') {
      timeline.push({
        status: 'cancelled',
        label: 'Task Cancelled',
        timestamp: task.cancelledAt,
        completed: true,
        reason: task.cancellationReason || booking?.cancellationReason,
      });
    }

    // Available actions based on current status and user role
    const availableActions = [];

    if (userRole === 'client') {
      if (task.status === 'posted') {
        availableActions.push('view_offers', 'cancel_task', 'edit_task');
      } else if (task.status === 'in_progress') {
        availableActions.push('cancel_task', 'complete_task', 'message_fixxer');
      } else if (task.status === 'completed') {
        availableActions.push('leave_review');
      }
    } else if (userRole === 'fixxer') {
      if (task.status === 'in_progress') {
        availableActions.push('cancel_task', 'complete_task', 'message_client');
      } else if (task.status === 'completed') {
        availableActions.push('view_review');
      }
    }

    return res.json({
      status: 'ok',
      data: {
        task: {
          id: task.id,
          title: task.taskTitle,
          description: task.taskDescription,
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
          completedAt: task.completedAt,
          cancelledAt: task.cancelledAt,
          cancellationReason: task.cancellationReason,
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
