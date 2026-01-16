import db from '@/config/dbConfig';
import { tasks } from '@/db/tables';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';

export const changeTaskStatus = async (req: Request, res: Response) => {
  const taskId = req.body.taskId;
  const status = req.body.status;
  if (!taskId) {
    return res
      .json({
        success: false,
        message: 'task-id not given',
      })
      .status(500);
  }
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task) {
    return res
      .json({
        success: false,
        message: 'Task not found',
      })
      .status(500);
  }
  if (status !== 'completed' && status !== 'cancelled') {
    return res
      .json({
        success: false,
        message: 'Send correct status.',
      })
      .status(500);
  }
  console.log(status);

  await db.update(tasks).set({ status: status }).where(eq(tasks.id, taskId));
  return res.json({
    success: true,
    message: 'Task status changed',
  });
};
