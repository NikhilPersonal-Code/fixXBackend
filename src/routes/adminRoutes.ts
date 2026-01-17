import { changeTaskStatus } from '@/controllers/admin/changeTaskStatus';
import { changeUserBlockedStatus } from '@/controllers/admin/changeUserBlockedStatus';
import {
  getTasksPostedStats,
  getTasksCompletedStats,
  getFixBitsPurchasesStats,
  getOfferConversionStats,
} from '@/controllers/admin/analytics';
import adminAuthMiddleware from '@/middleware/adminAuth';
import { Router } from 'express';

const router = Router();

router.patch('/change-task-status', adminAuthMiddleware, changeTaskStatus);
router.patch(
  '/change-user-blocked-status',
  adminAuthMiddleware,
  changeUserBlockedStatus,
);

// Analytics Routes
router.get('/stats/tasks-posted', adminAuthMiddleware, getTasksPostedStats);
router.get(
  '/stats/tasks-completed',
  adminAuthMiddleware,
  getTasksCompletedStats,
);
router.get(
  '/stats/fixbits-purchases',
  adminAuthMiddleware,
  getFixBitsPurchasesStats,
);
router.get(
  '/stats/offer-conversion',
  adminAuthMiddleware,
  getOfferConversionStats,
);

export default router;
