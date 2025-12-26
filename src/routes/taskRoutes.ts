import { Router } from 'express';
import {
  createTask,
  getTasks,
  getLatestTasks,
  getTaskById,
  getMyTasks,
  updateTask,
  cancelTask,
} from '@controllers/taskController';
import verifyToken from '@middleware/auth';

const router = Router();


// Public routes
router.get('/', getTasks); // Get all posted tasks (for feed)
router.get('/latest', getLatestTasks); // Get latest tasks (for notifications)
router.get('/:id', getTaskById); // Get single task details

// Protected routes (require authentication)
router.post('/', verifyToken, createTask); // Create a new task
router.get('/my/tasks', verifyToken, getMyTasks); // Get user's own tasks
router.put('/:id', verifyToken, updateTask); // Update a task
router.post('/:id/cancel', verifyToken, cancelTask); // Cancel a task

export default router;
