import { Router } from 'express';
import { getConversations } from '../controllers/message/getConversations';
import authenticateUser from '../middleware/auth';

const router = Router();

router.get('/conversations', authenticateUser, getConversations);

export default router;
