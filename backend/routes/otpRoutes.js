// backend/routes/otpRoutes.js
import express from 'express';
import {
  sendEmailVerificationOTP,
  verifyEmailOTP,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  send2FAOTP
} from '../controllers/otpController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/send-verification-otp', sendEmailVerificationOTP);
router.post('/change-password', sendPasswordResetOTP);
router.post('/verify-email-otp', verifyEmailOTP);
router.post('/send-password-reset-otp', sendPasswordResetOTP);
router.post('/resend-otp', sendPasswordResetOTP);
router.post('/  ', verifyPasswordResetOTP);

// Protected routes
router.post('/send-2fa-otp', authenticate, send2FAOTP);

export default router;