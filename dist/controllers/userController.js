"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = void 0;
const dbConfig_1 = __importDefault(require("../config/dbConfig"));
const tables_1 = require("../db/tables");
const drizzle_orm_1 = require("drizzle-orm");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const updateProfile = async (req, res) => {
    const { userId } = req.params;
    if (!req.file) {
        return res.status(400).json({ message: 'No profile image file uploaded.' });
    }
    // Construct the URL to the newly uploaded file
    const newProfileUrl = `/uploads/${req.file.filename}`;
    let oldProfileUrl = null;
    try {
        // 1. Fetch the user's current profileUrl before updating
        const user = await dbConfig_1.default.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(tables_1.users.id, userId),
            columns: { profileUrl: true },
        });
        if (user) {
            oldProfileUrl = user.profileUrl;
        }
        // 2. Update the user's profileUrl in the database with the new image
        await dbConfig_1.default
            .update(tables_1.users)
            .set({ profileUrl: newProfileUrl })
            .where((0, drizzle_orm_1.eq)(tables_1.users.id, userId));
        // 3. If an old local profile image exists, delete it from the server
        if (oldProfileUrl && oldProfileUrl.startsWith('/uploads/')) {
            const oldFilename = path_1.default.basename(oldProfileUrl); // Extract filename from URL
            // Construct the full path to the old file on the server
            const oldFilePath = path_1.default.join(__dirname, '..', '..', 'public', 'uploads', oldFilename);
            try {
                await fs_1.promises.unlink(oldFilePath); // Asynchronously delete the file
                console.log(`Successfully deleted old profile image: ${oldFilePath}`);
            }
            catch (deleteError) {
                // Log the error but don't prevent the request from succeeding
                console.error(`Error deleting old profile image ${oldFilePath}:`, deleteError);
            }
        }
        res.json({
            message: 'Profile updated successfully',
            profileUrl: newProfileUrl,
        });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Database error while updating profile.' });
    }
};
exports.updateProfile = updateProfile;
