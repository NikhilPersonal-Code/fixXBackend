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
  approveTaskCompletion,
  rejectTaskCompletion,
  getFixxerTasks,
} from '@controllers/task';
import verifyToken from '@middleware/auth';
import { getTaskImages } from '@/controllers/task/getTaskImages';
import upload, { multerUpload } from '@/middleware/upload';

const router = Router();

// Public routes
router.get('/', verifyToken, getTasks); // Get all posted tasks (for feed)
router.get('/latest', verifyToken, getLatestTasks); // Get latest tasks (for notifications)
router.get('/:id', getTaskById); // Get single task details

// Protected routes (require authentication)
router.post('/', verifyToken, multerUpload.any(), createTask); // Create a new task
router.get('/my/tasks', verifyToken, getMyTasks); // Get user's own tasks
router.get('/fixxer/all', verifyToken, getFixxerTasks); // Get tasks related to fixxer either fixxer was in that task and task is completed or it was cancelled by the poster or it is in currently in the progress in which fixxer is assigned the task
router.get('/:id/offers', verifyToken, getTaskOffers); // Get offers for a task (client view)
router.get('/:id/status', verifyToken, getTaskStatus); // Get task status with timeline
router.put('/:id', verifyToken, updateTask); // Update a task
router.delete('/:id', verifyToken, deleteTask); // Delete a task (posted tasks only)
router.post('/:id/cancel', verifyToken, cancelTask); // Cancel a posted task (before assignment)
router.post('/:id/cancel-ongoing', verifyToken, cancelOngoingTask); // Cancel an ongoing task
router.post('/:id/complete', verifyToken, completeTask); // Fixxer requests task completion
router.post('/:id/approve-completion', verifyToken, approveTaskCompletion); // Client approves completion
router.post('/:id/reject-completion', verifyToken, rejectTaskCompletion); // Client rejects completion
router.get('/:id/images', verifyToken, getTaskImages);

export default router;
