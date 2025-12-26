"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
router.post('/signup', authController_1.registerUser);
router.post('/login', authController_1.loginUser);
router.post('/googleLogin', authController_1.googleLogin);
router.post('/send-registration-otp', authController_1.sendEmailRegistrationOtp);
router.post('/logout', authController_1.logoutUser);
router.post('/send-forgot-password-otp', authController_1.sendForgotPasswordOtp);
router.post('/verify-forgot-password-otp', authController_1.verifyForgotPasswordOtp);
router.post('/delete-account/:userId', authController_1.deleteAccount);
router.post('/reset-password', authController_1.resetPassword);
exports.default = router;
