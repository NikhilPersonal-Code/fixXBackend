import { Request, Response } from 'express';
import db from '@config/db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { promises as fs } from 'fs';
import path from 'path';

export const updateProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const id = parseInt(userId);

  if (!req.file) {
    return res.status(400).json({ message: 'No profile image file uploaded.' });
  }

  // Construct the URL to the newly uploaded file
  const newProfileUrl = `/uploads/${req.file.filename}`;

  let oldProfileUrl: string | null = null;

  try {
    // 1. Fetch the user's current profile_url before updating
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: { profile_url: true },
    });

    if (user) {
      oldProfileUrl = user.profile_url;
    }

    // 2. Update the user's profile_url in the database with the new image
    await db
      .update(users)
      .set({ profile_url: newProfileUrl })
      .where(eq(users.id, id));

    // 3. If an old local profile image exists, delete it from the server
    if (oldProfileUrl && oldProfileUrl.startsWith('/uploads/')) {
      const oldFilename = path.basename(oldProfileUrl); // Extract filename from URL
      // Construct the full path to the old file on the server
      const oldFilePath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        'uploads',
        oldFilename,
      );

      try {
        await fs.unlink(oldFilePath); // Asynchronously delete the file
        console.log(`Successfully deleted old profile image: ${oldFilePath}`);
      } catch (deleteError) {
        // Log the error but don't prevent the request from succeeding
        console.error(
          `Error deleting old profile image ${oldFilePath}:`,
          deleteError,
        );
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
