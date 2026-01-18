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
  sendPhoneOtp,
  verifyPhoneOtp,
  userTokenValidCheck,
} from '@controllers/auth';
import verifyToken from '@middleware/auth';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/send-registration-otp', sendEmailRegistrationOtp);
router.post('/send-phone-otp', verifyToken, sendPhoneOtp);
router.post('/verify-phone-otp', verifyToken, verifyPhoneOtp);
router.get('/user-token-valid-check', verifyToken, userTokenValidCheck);
router.post('/logout', logoutUser);
router.post('/send-forgot-password-otp', sendForgotPasswordOtp);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);
router.post('/delete-account/:userId', deleteAccount);
router.post('/reset-password', resetPassword);

export default router;
