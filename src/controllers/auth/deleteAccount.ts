import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { users } from '@db/tables';
import { eq } from 'drizzle-orm';
import { promises as fs } from 'fs';
import path from 'path';

export const deleteAccount = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const id = userId;

  try {
    return await db.transaction(async (tx) => {
      // Get user's profile URL before deleting the user record
      const user = await tx.query.users.findFirst({
        where: eq(users.id, id),
        columns: { profileUrl: true },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const profileUrl = user.profileUrl;

      // 4. Delete the user from the users table.
      await tx.delete(users).where(eq(users.id, id));

      // After successful commit, delete the profile image file
      if (profileUrl && profileUrl.startsWith('/uploads/')) {
        const filename = path.basename(profileUrl);
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          'public',
          'uploads',
          filename,
        );
        try {
          await fs.unlink(filePath);
          console.log(`Successfully deleted profile image: ${filePath}`);
        } catch (deleteError) {
          // Log the error but don't fail the overall operation,
          // as the user's data has already been deleted from the DB.
          console.error(
            `Error deleting profile image ${filePath}:`,
            deleteError,
          );
        }
      }

      return res.json({
        message: 'Account deleted successfully.',
        status: 'ok',
      });
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res
      .status(500)
      .json({ message: 'Database error during account deletion.' });
  }
};
