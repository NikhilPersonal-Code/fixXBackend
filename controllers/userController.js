// controllers/userController.js
const db = require("../config/db");
const fs = require("fs").promises; // Use fs.promises for async file operations
const path = require("path");

exports.updateProfile = async (req, res) => {
  const { userId } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No profile image file uploaded." });
  }

  // Construct the URL to the newly uploaded file
  const newProfileUrl = `/uploads/${req.file.filename}`;

  let oldProfileUrl = null;

  try {
    // 1. Fetch the user's current profile_url before updating
    const [userRows] = await db.execute(
      "SELECT profile_url FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length > 0) {
      oldProfileUrl = userRows[0].profile_url;
    }

    // 2. Update the user's profile_url in the database with the new image
    await db.execute("UPDATE users SET profile_url = ? WHERE id = ?", [
      newProfileUrl,
      userId,
    ]);

    // 3. If an old local profile image exists, delete it from the server
    if (oldProfileUrl && oldProfileUrl.startsWith("/uploads/")) {
      const oldFilename = path.basename(oldProfileUrl); // Extract filename from URL
      // Construct the full path to the old file on the server
      const oldFilePath = path.join(__dirname, "..", "uploads", oldFilename);

      try {
        await fs.unlink(oldFilePath); // Asynchronously delete the file
        console.log(`Successfully deleted old profile image: ${oldFilePath}`);
      } catch (deleteError) {
        // Log the error but don't prevent the request from succeeding
        console.error(
          `Error deleting old profile image ${oldFilePath}:`,
          deleteError
        );
      }
    }

    res.json({
      message: "Profile updated successfully",
      profileUrl: newProfileUrl,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Database error while updating profile." });
  }
};
