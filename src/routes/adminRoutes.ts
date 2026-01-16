import { changeTaskStatus } from '@/controllers/admin/changeTaskStatus';
import { changeUserBlockedStatus } from '@/controllers/admin/changeUserBlockedStatus';
import adminAuthMiddleware from '@/middleware/adminAuth';
import { Router } from 'express';

const router = Router();

router.patch('/change-task-status', adminAuthMiddleware, changeTaskStatus);
router.patch(
  '/change-user-blocked-status',
  adminAuthMiddleware,
  changeUserBlockedStatus,
);

export default router;
