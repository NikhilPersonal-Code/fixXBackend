import express from 'express';
import { updateProfile } from '../controllers/userController';
import upload from '../middleware/upload';

const router = express.Router();

// Using PATCH for updating a resource is a good practice.
// The upload.single('profileImage') middleware will handle the file upload.
// 'profileImage' should be the name of the field in your form-data.
router.patch(
  '/updateprofile/:userId',
  upload.single('profileImage'),
  updateProfile,
);

export default router;
