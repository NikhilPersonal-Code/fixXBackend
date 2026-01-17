import { Response } from 'express';
import db from '@config/dbConfig';
import { tasks, taskTimeline, offers, fixBitsPurchases } from '@db/tables';
import { sql, eq, and } from 'drizzle-orm';
import { AuthRequest } from '@/types/request';

/**
 * Get daily stats for tasks posted
 */
export const getTasksPostedStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await db
      .select({
        date: sql<string>`TO_CHAR(${tasks.createdAt}, 'YYYY-MM-DD')`,
        taskPostedCount: sql<number>`count(*)`,
      })
      .from(tasks)
      .groupBy(sql`TO_CHAR(${tasks.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${tasks.createdAt}, 'YYYY-MM-DD') DESC`);

    return res.json({
      status: 'ok',
      stats,
    });
  } catch (error: any) {
    console.error('Error getting tasks posted stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get stats',
    });
  }
};

/**
 * Get daily stats for tasks completed
 */
export const getTasksCompletedStats = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // We look at task_timeline for 'completed' status events, or we can use tasks table if we trust updatedAt for completed status
    // Better to use tasks table where status = 'completed' and group by updatedAt (approximation) or created_at if we don't have completed_at
    // However, tasks table doesn't have completed_at.
    // The taskTimeline table has completedAt and status.

    /*
      Checking schema:
      taskTimeline has completedAt column.
    */

    const stats = await db
      .select({
        date: sql<string>`TO_CHAR(${taskTimeline.completedAt}, 'YYYY-MM-DD')`,
        tasksCompletedCount: sql<number>`count(*)`,
      })
      .from(taskTimeline)
      .where(sql`${taskTimeline.completedAt} IS NOT NULL`)
      .groupBy(sql`TO_CHAR(${taskTimeline.completedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${taskTimeline.completedAt}, 'YYYY-MM-DD') DESC`);

    return res.json({
      status: 'ok',
      stats,
    });
  } catch (error: any) {
    console.error('Error getting tasks completed stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get stats',
    });
  }
};

/**
 * Get daily stats for FixBits purchases
 */
export const getFixBitsPurchasesStats = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const stats = await db
      .select({
        date: sql<string>`TO_CHAR(${fixBitsPurchases.createdAt}, 'YYYY-MM-DD')`,
        // purchaseCount: sql<number>`count(*)`,
        totalFixbitsPurchased: sql<number>`sum(${fixBitsPurchases.amount})`,
        // totalCost: sql<number>`sum(${fixBitsPurchases.cost})`,
      })
      .from(fixBitsPurchases)
      .groupBy(sql`TO_CHAR(${fixBitsPurchases.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${fixBitsPurchases.createdAt}, 'YYYY-MM-DD') DESC`);

    return res.json({
      status: 'ok',
      stats,
    });
  } catch (error: any) {
    console.error('Error getting fixbits stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get stats',
    });
  }
};

/**
 * Get offer to assignment conversion rate
 * Calculates: (Accepted Offers / Total Offers) * 100
 * Can be broken down by day
 */
export const getOfferConversionStats = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const stats = await db
      .select({
        date: sql<string>`TO_CHAR(${offers.createdAt}, 'YYYY-MM-DD')`,
        totalOffers: sql<number>`count(*)`,
        acceptedOffers: sql<number>`count(*) filter (where ${offers.status} = 'accepted')`,
        conversionRate: sql<number>`round((count(*) filter (where ${offers.status} = 'accepted')::decimal / count(*)::decimal) * 100, 2)`,
      })
      .from(offers)
      .groupBy(sql`TO_CHAR(${offers.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${offers.createdAt}, 'YYYY-MM-DD') DESC`);

    // Overall stats
    const [overall] = await db
      .select({
        totalOffers: sql<number>`count(*)`,
        acceptedOffers: sql<number>`count(*) filter (where ${offers.status} = 'accepted')`,
        conversionRate: sql<number>`round((count(*) filter (where ${offers.status} = 'accepted')::decimal / count(*)::decimal) * 100, 2)`,
      })
      .from(offers);

    return res.json({
      status: 'ok',
      stats: {
        daily: stats,
        overall: overall || {
          totalOffers: 0,
          acceptedOffers: 0,
          conversionRate: 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting conversion stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get stats',
    });
  }
};
