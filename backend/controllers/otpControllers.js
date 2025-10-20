// backend/controllers/otpController.js
import emailService from '../service/emailService.js';
import User from '../models/User.js';

export const sendEmailVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    const result = await emailService.sendEmailVerificationOTP(email, user.name);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Verification OTP sent successfully',
      // In production, don't include otpId
      otpId: process.env.NODE_ENV === 'development' ? result.otpId : undefined
    });

  } catch (error) {
    console.error('Error sending verification OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification OTP',
      error: error.message
    });
  }
};

export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await emailService.verifyOTP(email, otp, 'email_verification');

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Update user as verified
    await User.update(user.id, { is_verified: true });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Error verifying email OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email OTP',
      error: error.message
    });
  }
};

export const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal that user doesn't exist for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset OTP has been sent'
      });
    }

    const result = await emailService.sendPasswordResetOTP(email, user.name);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Password reset OTP sent successfully',
      otpId: process.env.NODE_ENV === 'development' ? result.otpId : undefined
    });

  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending password reset OTP',
      error: error.message
    });
  }
};

export const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await emailService.verifyOTP(email, otp, 'password_reset');

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Update user password
    const user = await User.findByEmail(email);
    if (user) {
      await User.updatePassword(user.id, newPassword);
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Error verifying password reset OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying password reset OTP',
      error: error.message
    });
  }
};

export const send2FAOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = req.user; // From authentication middleware

    const result = await emailService.send2FAOTP(email, user.name);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: '2FA OTP sent successfully',
      otpId: process.env.NODE_ENV === 'development' ? result.otpId : undefined
    });

  } catch (error) {
    console.error('Error sending 2FA OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending 2FA OTP',
      error: error.message
    });
  }
};