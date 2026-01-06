import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { eq } from 'drizzle-orm';
import { deleteFromCloudinary, getPublicIdFromUrl } from '@middleware/upload';
import { type UpdateProfileRequest } from '@/types/request';

export const updateProfile = async (
  req: UpdateProfileRequest,
  res: Response,
) => {
  const { userId } = req.params;

  // Get Cloudinary URL from the middleware
  const newProfileUrl = req.cloudinaryUrl;

  if (!newProfileUrl) {
    return res.status(400).json({ message: 'No profile image file uploaded.' });
  }

  let oldProfileUrl: string | null = null;

  try {
    // 1. Fetch the user's current profileUrl before updating
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { profileUrl: true },
    });

    if (user) {
      oldProfileUrl = user.profileUrl;
    }

    // 2. Update the user's profileUrl in the database with the new Cloudinary URL
    await db
      .update(users)
      .set({ profileUrl: newProfileUrl })
      .where(eq(users.id, userId));

    // 3. If an old Cloudinary image exists, delete it
    if (oldProfileUrl && oldProfileUrl.includes('cloudinary.com')) {
      const publicId = getPublicIdFromUrl(oldProfileUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    res.json({
      message: 'Profile updated successfully',
      profileUrl: newProfileUrl,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Database error while updating profile.' });
  }
};
