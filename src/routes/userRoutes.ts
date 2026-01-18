import express from 'express';
import {
  updateProfile,
  updateFcmToken,
  getFixxerPublicProfile,
  getUserStats,
  purchaseFixBits,
} from '@controllers/user';
import upload from '@middleware/upload';
import authMiddleware from '@middleware/auth';

const router = express.Router();

// Public routes
router.get('/fixxer/:fixxerId/profile', getFixxerPublicProfile); // Get fixxer's public profile

router.get('/stats', authMiddleware, getUserStats);
router.post('/fixbits/purchase', authMiddleware, purchaseFixBits);

// Using PATCH for updating a resource is a good practice.
// The upload.single('profileImage') middleware will handle the file upload to Cloudinary.
// 'profileImage' should be the name of the field in your form-data.
router.patch(
  '/updateprofile/:userId',
  ...upload.single('profileImage'),
  updateProfile,
);

router.put('/fcm-token', authMiddleware, updateFcmToken);

export default router;
