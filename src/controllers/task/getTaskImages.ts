import db from '@/config/dbConfig';
import { taskImages, tasks } from '@/db/tables';
import { AuthRequest } from '@/types';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';

export const getTaskImages = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;

    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));

    if (!task) {
      return res.json({
        success: false,
        error: 'No task exist as per the passed ID',
      });
    }

    const images = await db
      .select({
        imageUrl: taskImages.imageUrl,
      })
      .from(taskImages)
      .where(eq(taskImages.id, taskId));

    if (images.length === 0) {
      return res.json({
        success: true,
        images: [],
        message: 'No images found',
      });
    }

    return res.json({
      success: true,
      images: images,
    });
  } catch (error) {
    console.log('Error occurred fetching task images : ' + error);
    return res.json({
      success: false,
      error,
    });
  }
};
