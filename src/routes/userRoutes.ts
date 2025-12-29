import express from 'express';
import { updateProfile, updateFcmToken } from '@controllers/user';
import upload from '@middleware/upload';
import authMiddleware from '@middleware/auth';

const router = express.Router();

// Using PATCH for updating a resource is a good practice.
// The upload.single('profileImage') middleware will handle the file upload to Cloudinary.
// 'profileImage' should be the name of the field in your form-data.
router.patch(
  '/updateprofile/:userId',
  ...upload.single('profileImage'),
  updateProfile,
);

router.post('/fcm-token', authMiddleware, updateFcmToken);

export default router;
