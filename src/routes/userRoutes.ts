import express from 'express';
import { updateProfile } from '@controllers/user';
import upload from '@middleware/upload';

const router = express.Router();

// Using PATCH for updating a resource is a good practice.
// The upload.single('profileImage') middleware will handle the file upload to Cloudinary.
// 'profileImage' should be the name of the field in your form-data.
router.patch(
  '/updateprofile/:userId',
  ...upload.single('profileImage'),
  updateProfile,
);

export default router;
