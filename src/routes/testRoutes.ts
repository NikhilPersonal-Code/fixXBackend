import express from 'express';
import { getUsers, getAnything, test, prepopulateData } from '@controllers/testController';

const router = express.Router();

router.get('/getusers', getUsers);
router.post('/get', getAnything);
router.get('/test', test);
router.get('/prepopulate-data', prepopulateData);

export default router;
