// controllers/authController.js
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { downloadImage } = require("../utils/imageDownloader");
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../utils/mailer");

const fs = require("fs").promises;
const path = require("path");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;
  let tokenData;
  try {
    // 1. Verify Google Token

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub, picture } = payload;
    const username = email.split("@")[0];
    // 2. Check if user exists
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    let userId;
    if (rows.length === 0) {
      // Download the Google profile picture to our server
      const localProfileUrl = await downloadImage(picture);

      // 3. Register new Google user
      const hashed = await bcrypt.hash(sub, 10); // hash Google sub as pseudo password

      const [result] = await db.execute(
        "INSERT INTO users (name, email, username, password_hash, profile_url,isActive) VALUES (?, ?, ?, ?,?,1)",
        [name, email, username, hashed, localProfileUrl]
      );
      userId = result.insertId;
      tokenData = {
        id: userId,
        name: name,
        email: email,
        username: username,
      };
    } else {
      userId = rows[0].id;
      await db.execute("UPDATE users SET isActive = 1 WHERE id = ?", [userId]);

      // If the user's profile_url is still a google url, download it and update it.
      const [user] = rows;
      if (user.profile_url && user.profile_url.startsWith("http")) {
        const localProfileUrl = await downloadImage(user.profile_url);
        await db.execute("UPDATE users SET profile_url = ? WHERE id = ?", [
          localProfileUrl,
          userId,
        ]);
      } else if (!user.profile_url) {
        const localProfileUrl = await downloadImage(picture);
        await db.execute("UPDATE users SET profile_url = ? WHERE id = ?", [
          localProfileUrl,
          userId,
        ]);
      }
      tokenData = {
        id: userId,
        name: rows[0].name,
        email: rows[0].email,
        username: rows[0].username,
      };
    }
    const [imageRow] = await db.execute(
      "SELECT profile_url FROM users WHERE id = ?",
      [userId]
    );
    // 4. Generate JWT

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const userData = { ...tokenData, picture: imageRow[0].profile_url };
    return res.json({
      token,
      userData,
      status: "ok",
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid Google token" });
  }
};

exports.sendEmailRegistrationOtp = async (req, res) => {
  const { email } = req.body;

  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (rows.length === 0) {
      const sentOtp = Math.floor(100000 + Math.random() * 900000).toString();

      const [otp] = await connection.execute(
        "SELECT otp FROM otps WHERE email = ?",
        [email]
      );
      if (otp.length === 0) {
        await sendVerificationEmail(email, sentOtp);
        await connection.execute(
          "INSERT INTO otps (email, otp) VALUES (?, ?)",
          [email, sentOtp]
        );
      } else {
        await sendVerificationEmail(email, sentOtp);
        await connection.execute("UPDATE otps SET otp = ? WHERE email = ?", [
          sentOtp,
          email,
        ]);
      }
      return res.status(200).json({ message: "OTP Sent", status: "ok" });
    } else {
      return res
        .status(409)
        .json({ message: "This Email is already registered" });
    }
  } catch (error) {
    console.error("Send Registration OTP Error:", error);
  }
};
exports.registerUser = async (req, res) => {
  const { email, password, otp, username, name } = req.body;

  const connection = await db.getConnection(); // get a connection for the transaction
  try {
    const [otpRows] = await connection.execute(
      "SELECT * FROM otps WHERE email = ?",
      [email]
    );
    if (otpRows.length === 0) {
      return res.status(400).json({ message: "Some Error Occured Try Again" });
    }
    const sentOtp = otpRows[0].otp;

    if (otp !== sentOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    } else {
      await connection.beginTransaction();

      // Check if username or email exists
      const [rows] = await connection.execute(
        "SELECT * FROM users WHERE username = ? or email = ?",
        [username, email]
      );

      if (rows.length > 0) {
        await connection.release();
        return res
          .status(409)
          .json({ message: "Username or email already exists. Try another." });
      }
      const hashed = await bcrypt.hash(password, 10);

      // Insert the new user
      const [result] = await connection.execute(
        `INSERT INTO users (username, password_hash, name, email,isActive) 
       VALUES (?, ?, ?, ?,0)`,
        [username, hashed, name, email]
      );

      const userId = result.insertId;

      await connection.execute("DELETE FROM otps WHERE email = ?", [email]);
      // Commit transaction
      await connection.commit();

      res.status(201).json({
        message: "Email Verified and User registered successfully",
        status: "ok",
      });
    }
  } catch (err) {
    await connection.rollback();
    await connection.release();
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.loginUser = async (req, res) => {
  const { username, password, email } = req.body;
  searchParam = username && !email ? username : email;

  const query =
    username && !email
      ? `SELECT * FROM users WHERE username = ?`
      : `SELECT * FROM users WHERE email = ?`;

  const [rows] = await db.execute(query, [searchParam]);

  if (rows.length === 0) {
    return res.status(401).json({ message: "User not found" });
  }

  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (valid && rows.length !== 0) {
    await db.execute("UPDATE users SET isActive = 1 WHERE id = ?;", [
      rows[0].id,
    ]);
  }
  const userData = {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    username: rows[0].username,
    picture: rows[0].profile_url,
  };
  const token = jwt.sign(
    {
      userId: rows[0].id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token, status: "ok", userData });
};
exports.sendForgotPasswordOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    // Always send a success response to prevent user enumeration attacks
    if (rows.length === 0) {
      return res.json({
        message:
          "If an account with that email exists, a reset OTP has been sent.",
      });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Store the OTP and its expiration in the database
    await db.execute(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
      [otp, otpExpires, email]
    );

    // Send the email
    await sendPasswordResetEmail(email, otp);

    res.json({
      message:
        "If an account with that email exists, a reset OTP has been sent.",
      status: "ok",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    // Generic error to avoid leaking information
    res.status(500).json({ message: "An error occurred." });
  }
};

exports.verifyForgotPasswordOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()",
      [email, otp]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
    res.json({ message: "OTP verified successfully.", status: "ok" });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "An error occurred." });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // First, re-verify the OTP to ensure it's still valid
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()",
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Hash the new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update the password and clear the reset token fields
    await db.execute(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?",
      [hashed, email]
    );

    res.json({
      message: "Password has been reset successfully.",
      status: "ok",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "An error occurred." });
  }
};

exports.logoutUser = async (req, res) => {
  const { id } = req.body;

  await db.execute("UPDATE users SET isActive = 0 WHERE id = ?;", id);
  res.json({ message: "User logged out successfully" });
};

exports.deleteAccount = async (req, res) => {
  const { userId } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get user's profile URL before deleting the user record
    const [userRows] = await connection.execute(
      "SELECT profile_url FROM users WHERE id = ?",
      [userId]
    );
    const profileUrl = userRows.length > 0 ? userRows[0].profile_url : null;

    // 4. Delete the user from the users table.
    const [deleteResult] = await connection.execute(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    if (deleteResult.affectedRows === 0) {
      // If no user was found to delete, rollback and send a 404.
      await connection.rollback();
      return res.status(404).json({ message: "User not found." });
    }

    await connection.commit();

    // After successful commit, delete the profile image file
    if (profileUrl && profileUrl.startsWith("/uploads/")) {
      const filename = path.basename(profileUrl);
      const filePath = path.join(__dirname, "..", "uploads", filename);
      try {
        await fs.unlink(filePath);
        console.log(`Successfully deleted profile image: ${filePath}`);
      } catch (deleteError) {
        // Log the error but don't fail the overall operation,
        // as the user's data has already been deleted from the DB.
        console.error(`Error deleting profile image ${filePath}:`, deleteError);
      }
    }

    res.json({ message: "Account deleted successfully.", status: "ok" });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Account Error:", error);
    res
      .status(500)
      .json({ message: "Database error during account deletion." });
  } finally {
    if (connection) connection.release();
  }
};
