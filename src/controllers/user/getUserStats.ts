import { Request, Response } from 'express';
import { users, fixxerProfiles, bookings, tasks } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuthRequest } from '@/types';
import db from '@/config/dbConfig';

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let stats = {
      tasksCount: 0,
      rating: '0.0',
      money: '0',
      label: 'Earned', // or 'Spent'
      fixBits: 0,
    };

    if (user.userRole === 'fixxer' || user.userRole === 'both') {
      // Get Fixxer Stats
      const profile = await db.query.fixxerProfiles.findFirst({
        where: eq(fixxerProfiles.userId, userId),
      });

      if (profile) {
        stats.fixBits = profile.fixBits;
      }

      // Calculate earnings
      const earningsResult = await db
        .select({
          total: sql<string>`sum(${bookings.agreedPrice})`,
        })
        .from(bookings)
        .where(
          and(eq(bookings.fixxerId, userId), eq(bookings.status, 'completed')),
        );

      const totalEarnings = earningsResult[0]?.total || '0';

      // Count completed tasks directly from bookings to be safe
      const completedTasksResult = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(bookings)
        .where(
          and(eq(bookings.fixxerId, userId), eq(bookings.status, 'completed')),
        );

      const completedTasks = completedTasksResult[0]?.count || 0;

      stats = {
        ...stats,
        tasksCount: completedTasks,
        rating: profile?.averageRating || '0.0',
        money: totalEarnings,
        label: 'Earned',
      };
    } else {
      // Client Stats
      // Count posted tasks
      const tasksResult = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(tasks)
        .where(eq(tasks.clientId, userId));

      // Calculate spent
      const spentResult = await db
        .select({
          total: sql<string>`sum(${bookings.agreedPrice})`,
        })
        .from(bookings)
        .where(
          and(eq(bookings.clientId, userId), eq(bookings.status, 'completed')),
        );

      const totalSpent = spentResult[0]?.total || '0';

      stats = {
        tasksCount: tasksResult[0]?.count || 0,
        rating: 'N/A', // Clients don't have ratings yet
        money: totalSpent,
        label: 'Spent',
        fixBits: 0,
      };
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
