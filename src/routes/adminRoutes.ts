import { changeTaskStatus } from '@/controllers/admin/changeTaskStatus';
import { changeUserBlockedStatus } from '@/controllers/admin/changeUserBlockedStatus';
import { Router } from 'express';

const router = Router();

router.patch('/change-task-status', changeTaskStatus);
router.patch('/change-user-blocked-status', changeUserBlockedStatus);

export default router;
