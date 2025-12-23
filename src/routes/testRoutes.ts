import express from 'express';
import { getUsers, getAnything, test } from '../controllers/testController';
import authMiddleware from '../middleware/auth';

const router = express.Router();

router.get('/getusers', getUsers);
router.post('/get', getAnything);
router.get('/test', test);

export default router;
