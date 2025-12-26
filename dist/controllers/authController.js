"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.logoutUser = exports.resetPassword = exports.verifyForgotPasswordOtp = exports.sendForgotPasswordOtp = exports.loginUser = exports.registerUser = exports.sendEmailRegistrationOtp = exports.googleLogin = void 0;
const dbConfig_1 = __importDefault(require("../config/dbConfig"));
const tables_1 = require("../db/tables");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const imageDownloader_1 = require("../utils/imageDownloader");
const mailer_1 = require("../utils/mailer");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googleLogin = async (req, res) => {
    const { idToken } = req.body;
    let tokenData;
    try {
        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(401).json({ message: 'Invalid Google token' });
        }
        const { email, name, sub, picture } = payload;
        const username = email?.split('@')[0];
        // 2. Check if user exists
        const existingUser = await dbConfig_1.default.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(tables_1.users.email, email),
        });
        let userId;
        if (!existingUser) {
            // Download the Google profile picture to our server
            const localProfileUrl = picture ? await (0, imageDownloader_1.downloadImage)(picture) : null;
            // 3. Register new Google user
            const hashed = await bcrypt_1.default.hash(sub, 10); // hash Google sub as pseudo password
            const [result] = await dbConfig_1.default
                .insert(tables_1.users)
                .values({
                username: username,
                name: name,
                email: email,
                passwordHash: hashed,
                profileUrl: localProfileUrl,
                isActive: true,
            })
                .returning({ insertId: tables_1.users.id });
            userId = result.insertId;
            tokenData = {
                id: userId,
                name: name,
                email: email,
                username: username,
            };
        }
        else {
            userId = existingUser.id;
            await dbConfig_1.default
                .update(tables_1.users)
                .set({ isActive: true })
                .where((0, drizzle_orm_1.eq)(tables_1.users.id, userId));
            // If the user's profileUrl is still a google url, download it and update it.
            if (existingUser.profileUrl &&
                existingUser.profileUrl.startsWith('http')) {
                const localProfileUrl = await (0, imageDownloader_1.downloadImage)(existingUser.profileUrl);
                await dbConfig_1.default
                    .update(tables_1.users)
                    .set({ profileUrl: localProfileUrl })
                    .where((0, drizzle_orm_1.eq)(tables_1.users.id, userId));
            }
            else if (!existingUser.profileUrl && picture) {
                const localProfileUrl = await (0, imageDownloader_1.downloadImage)(picture);
                await dbConfig_1.default
                    .update(tables_1.users)
                    .set({ profileUrl: localProfileUrl })
                    .where((0, drizzle_orm_1.eq)(tables_1.users.id, userId));
            }
            tokenData = {
                id: userId,
                name: existingUser.name,
                email: existingUser.email,
                username: existingUser.username,
            };
        }
        const userWithImage = await dbConfig_1.default.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(tables_1.users.id, userId),
            columns: { profileUrl: true },
        });
        // 4. Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });
        const userData = { ...tokenData, picture: userWithImage?.profileUrl };
        return res.json({
            token,
            userData,
            status: 'ok',
        });
    }
    catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Invalid Google token' });
    }
};
exports.googleLogin = googleLogin;
const sendEmailRegistrationOtp = async (req, res) => {
    const { email } = req.body;
    console.log("email : " + email);
    try {
        const existingUser = await dbConfig_1.default.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(tables_1.users.email, email),
        });
        if (!existingUser) {
            const sentOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const existingOtp = await dbConfig_1.default.query.otps.findFirst({
                where: (0, drizzle_orm_1.eq)(tables_1.otps.email, email),
            });
            if (!existingOtp) {
                await (0, mailer_1.sendVerificationEmail)(email, sentOtp);
                await dbConfig_1.default.insert(tables_1.otps).values({
                    email,
                    otp: sentOtp,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                }); // OTP expires in 10 minutes
            }
            else {
                await (0, mailer_1.sendVerificationEmail)(email, sentOtp);
                await dbConfig_1.default
                    .update(tables_1.otps)
                    .set({ otp: sentOtp })
                    .where((0, drizzle_orm_1.eq)(tables_1.otps.email, email));
            }
            return res.status(200).json({ message: 'OTP Sent', status: 'ok' });
        }
        else {
            return res
                .status(409)
                .json({ message: 'This Email is already registered' });
        }
    }
    catch (error) {
        console.error('Send Registration OTP Error:', error);
        return res.status(500).json({ message: 'An error occurred.' });
    }
};
exports.sendEmailRegistrationOtp = sendEmailRegistrationOtp;
const registerUser = async (req, res) => {
    const { email, password, otp, username, name } = req.body;
    try {
        const otpRecord = await dbConfig_1.default.query.otps.findFirst({
            where: (0, drizzle_orm_1.eq)(tables_1.otps.email, email),
        });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Some Error Occured Try Again' });
        }
        if (otp !== otpRecord.otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        else {
            return await dbConfig_1.default.transaction(async (tx) => {
                const existingUser = await tx.query.users.findFirst({
                    where: (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(tables_1.users.username, username), (0, drizzle_orm_1.eq)(tables_1.users.email, email)),
                });
                if (existingUser) {
                    return res.status(409).json({
                        message: 'Username or email already exists. Try another.',
                    });
                }
                const hashed = await bcrypt_1.default.hash(password, 10);
                await tx.insert(tables_1.users).values({
                    passwordHash: hashed,
                    name,
                    email,
                    username,
                });
                await tx.delete(tables_1.otps).where((0, drizzle_orm_1.eq)(tables_1.otps.email, email));
                return res.status(201).json({
                    message: 'Email Verified and User registered successfully',
                    status: 'ok',
                });
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { username, password, email } = req.body;
    const searchParam = username && !email ? username : email;
    const user = await dbConfig_1.default.query.users.findFirst({
        where: username && !email
            ? (0, drizzle_orm_1.eq)(tables_1.users.username, searchParam)
            : (0, drizzle_orm_1.eq)(tables_1.users.email, searchParam),
    });
    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }
    const valid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    await dbConfig_1.default.update(tables_1.users).set({ isActive: true }).where((0, drizzle_orm_1.eq)(tables_1.users.id, user.id));
    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        picture: user.profileUrl,
    };
    const token = jsonwebtoken_1.default.sign({
        userId: user.id,
    }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, status: 'ok', userData });
};
exports.loginUser = loginUser;
const sendForgotPasswordOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await dbConfig_1.default.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(tables_1.users.email, email),
        });
        // Always send a success response to prevent user enumeration attacks
        if (!user) {
            return res.json({
                message: 'If an account with that email exists, a reset OTP has been sent.',
            });
        }
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
        // Store the OTP and its expiration in the database
        await dbConfig_1.default
            .update(tables_1.users)
            .set({ resetToken: otp, resetTokenExpires: otpExpires })
            .where((0, drizzle_orm_1.eq)(tables_1.users.email, email));
        // Send the email
        await (0, mailer_1.sendPasswordResetEmail)(email, otp);
        res.json({
            message: 'If an account with that email exists, a reset OTP has been sent.',
            status: 'ok',
        });
    }
    catch (error) {
        console.error('Forgot Password Error:', error);
        // Generic error to avoid leaking information
        res.status(500).json({ message: 'An error occurred.' });
    }
};
exports.sendForgotPasswordOtp = sendForgotPasswordOtp;
const verifyForgotPasswordOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await dbConfig_1.default.query.users.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(tables_1.users.email, email), (0, drizzle_orm_1.eq)(tables_1.users.resetToken, otp), (0, drizzle_orm_1.gt)(tables_1.users.resetTokenExpires, new Date())),
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        res.json({ message: 'OTP verified successfully.', status: 'ok' });
    }
    catch (error) {
        console.error('OTP Verification Error:', error);
        res.status(500).json({ message: 'An error occurred.' });
    }
};
exports.verifyForgotPasswordOtp = verifyForgotPasswordOtp;
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        // First, re-verify the OTP to ensure it's still valid
        const user = await dbConfig_1.default.query.users.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(tables_1.users.email, email), (0, drizzle_orm_1.eq)(tables_1.users.resetToken, otp), (0, drizzle_orm_1.gt)(tables_1.users.resetTokenExpires, new Date())),
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        // Hash the new password
        const hashed = await bcrypt_1.default.hash(newPassword, 10);
        // Update the password and clear the reset token fields
        await dbConfig_1.default
            .update(tables_1.users)
            .set({
            passwordHash: hashed,
            resetToken: null,
            resetTokenExpires: null,
        })
            .where((0, drizzle_orm_1.eq)(tables_1.users.email, email));
        res.json({
            message: 'Password has been reset successfully.',
            status: 'ok',
        });
    }
    catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'An error occurred.' });
    }
};
exports.resetPassword = resetPassword;
const logoutUser = async (req, res) => {
    const { id } = req.body;
    await dbConfig_1.default.update(tables_1.users).set({ isActive: true }).where((0, drizzle_orm_1.eq)(tables_1.users.id, id));
    res.json({ message: 'User logged out successfully' });
};
exports.logoutUser = logoutUser;
const deleteAccount = async (req, res) => {
    const { userId } = req.params;
    const id = userId;
    try {
        return await dbConfig_1.default.transaction(async (tx) => {
            // Get user's profile URL before deleting the user record
            const user = await tx.query.users.findFirst({
                where: (0, drizzle_orm_1.eq)(tables_1.users.id, id),
                columns: { profileUrl: true },
            });
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }
            const profileUrl = user.profileUrl;
            // 4. Delete the user from the users table.
            await tx.delete(tables_1.users).where((0, drizzle_orm_1.eq)(tables_1.users.id, id));
            // After successful commit, delete the profile image file
            if (profileUrl && profileUrl.startsWith('/uploads/')) {
                const filename = path_1.default.basename(profileUrl);
                const filePath = path_1.default.join(__dirname, '..', '..', 'public', 'uploads', filename);
                try {
                    await fs_1.promises.unlink(filePath);
                    console.log(`Successfully deleted profile image: ${filePath}`);
                }
                catch (deleteError) {
                    // Log the error but don't fail the overall operation,
                    // as the user's data has already been deleted from the DB.
                    console.error(`Error deleting profile image ${filePath}:`, deleteError);
                }
            }
            return res.json({
                message: 'Account deleted successfully.',
                status: 'ok',
            });
        });
    }
    catch (error) {
        console.error('Delete Account Error:', error);
        res
            .status(500)
            .json({ message: 'Database error during account deletion.' });
    }
};
exports.deleteAccount = deleteAccount;
