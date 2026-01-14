import { Router } from 'express';
import {
  createTask,
  getTasks,
  getLatestTasks,
  getTaskById,
  getMyTasks,
  updateTask,
  cancelTask,
  getTaskOffers,
  completeTask,
  cancelOngoingTask,
  getTaskStatus,
  deleteTask,
} from '@controllers/task';
import verifyToken from '@middleware/auth';
import { getTaskImages } from '@/controllers/task/getTaskImages';
import upload, { multerUpload } from '@/middleware/upload';

const router = Router();

// Public routes
router.get('/', getTasks); // Get all posted tasks (for feed)
router.get('/latest', getLatestTasks); // Get latest tasks (for notifications)
router.get('/:id', getTaskById); // Get single task details

// Protected routes (require authentication)
router.post('/', verifyToken, multerUpload.any(), createTask); // Create a new task
router.get('/my/tasks', verifyToken, getMyTasks); // Get user's own tasks
router.get('/:id/offers', verifyToken, getTaskOffers); // Get offers for a task (client view)
router.get('/:id/status', verifyToken, getTaskStatus); // Get task status with timeline
router.put('/:id', verifyToken, updateTask); // Update a task
router.delete('/:id', verifyToken, deleteTask); // Delete a task (posted tasks only)
router.post('/:id/cancel', verifyToken, cancelTask); // Cancel a posted task (before assignment)
router.post('/:id/cancel-ongoing', verifyToken, cancelOngoingTask); // Cancel an ongoing task
router.post('/:id/complete', verifyToken, completeTask); // Mark task as completed
router.get('/:id/images', verifyToken, getTaskImages);

export default router;
