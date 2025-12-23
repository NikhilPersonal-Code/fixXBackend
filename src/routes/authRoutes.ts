import express from 'express';
import {
  registerUser,
  loginUser,
  googleLogin,
  logoutUser,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  sendEmailRegistrationOtp,
  resetPassword,
  deleteAccount,
} from '@controllers/authController';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/googleLogin', googleLogin);
router.post('/send-registration-otp', sendEmailRegistrationOtp);
router.post('/logout', logoutUser);
router.post('/send-forgot-password-otp', sendForgotPasswordOtp);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);
router.post('/delete-account/:userId', deleteAccount);
router.post('/reset-password', resetPassword);

export default router;
