// backend/routes/auth.js
import express from 'express';
import pool from '../database.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import transporter from '../config/emailTemplates.js';
import { otpTemplates } from '../config/emailTemplates.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Send email verification OTP
router.post('/send-verification-otp', async (req, res) => {
  try {
    const { email, name } = req.body;

    console.log('📧 Verification OTP requested for:', email);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    const userName = user ? user.name : (name || 'User');

    // Generate OTP
    const otpRecord = await OTP.generateOTP(email, 'email_verification', 10);
    console.log('📧 Verification OTP generated:', otpRecord.otp);

    // Send email
    const emailTemplate = otpTemplates.emailVerification({ 
      userName, 
      otp: otpRecord.otp 
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });

    console.log('✅ Verification OTP sent to:', email);
    res.json({ 
      success: true, 
      message: 'Verification OTP sent successfully' 
    });

  } catch (error) {
    console.error('❌ Send verification OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to send verification OTP',
      details: error.message 
    });
  }
});

// Send password reset OTP
router.post('/send-password-reset-otp', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔐 Password reset OTP requested for:', email);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otpRecord = await OTP.generateOTP(email, 'password_reset', 10);
    console.log('📧 OTP generated:', otpRecord.otp);

    // Send email
    const emailTemplate = otpTemplates.passwordReset({ 
      userName: user.name, 
      otp: otpRecord.otp 
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });

    console.log('✅ Password reset OTP sent to:', email);
    res.json({ 
      success: true, 
      message: 'Password reset OTP sent successfully' 
    });

  } catch (error) {
    console.error('❌ Send password reset OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to send password reset OTP',
      details: error.message 
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, type } = req.body;

    console.log('🔄 Resend OTP requested for:', email, 'Type:', type);

    if (!email || !type) {
      return res.status(400).json({ error: 'Email and type are required' });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otpRecord = await OTP.generateOTP(email, type, 10);
    console.log('📧 OTP generated:', otpRecord.otp);

    // Send email based on type
    let emailTemplate;
    if (type === 'email_verification') {
      emailTemplate = otpTemplates.emailVerification({
        userName: user.name,
        otp: otpRecord.otp
      });
    } else if (type === 'password_reset') {
      emailTemplate = otpTemplates.passwordReset({
        userName: user.name,
        otp: otpRecord.otp
      });
    } else {
      return res.status(400).json({ error: 'Invalid OTP type' });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });

    console.log('✅ OTP resent to:', email);
    res.json({ 
      success: true, 
      message: 'OTP resent successfully' 
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to resend OTP',
      details: error.message 
    });
  }
});

// Verify OTP
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    console.log('🔍 OTP verification requested for:', email, 'Type:', type);

    if (!email || !otp || !type) {
      return res.status(400).json({ 
        error: 'Email, OTP, and type are required' 
      });
    }

    // Verify OTP
    const result = await OTP.verifyOTP(email, otp, type);

    if (result.valid) {
      // If email verification, mark user as verified
      if (type === 'email_verification') {
        await pool.query(
          'UPDATE users SET is_verified = true WHERE email = $1',
          [email]
        );
        console.log('✅ Email verified for:', email);
      }

      res.json({ 
        success: true, 
        message: result.message,
        type 
      });
    } else {
      res.status(400).json({ 
        error: result.message 
      });
    }

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ 
      error: 'OTP verification failed',
      details: error.message 
    });
  }
});

// Reset password with OTP (forgot password flow)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    console.log('🔐 Password reset requested for:', email);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        error: 'Email, OTP, and new password are required' 
      });
    }

    // Verify OTP first
    const otpResult = await OTP.verifyOTP(email, otp, 'password_reset');
    
    if (!otpResult.valid) {
      console.log('❌ Invalid or expired OTP for:', email);
      return res.status(400).json({ error: otpResult.message });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    console.log('✅ Password reset successful for:', email);
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({
      error: 'Failed to reset password',
      details: error.message
    });
  }
});

// Verify password reset OTP
router.post('/verify-password-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('🔍 Password reset OTP verification requested for:', email);
    
    if (!email || !otp) {
      return res.status(400).json({ 
        error: 'Email and OTP are required' 
      });
    }
    
    // Verify OTP
    const result = await OTP.verifyOTP(email, otp, 'password_reset');
    
    if (result.valid) {
      res.json({ 
        success: true, 
        message: result.message 
      });
    } else {
      res.status(400).json({ 
        error: result.message 
      });
    }
  } catch (error) {
    console.error('❌ Verify password reset OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to verify OTP',
      details: error.message 
    });
  }
});
// Reset password after OTP verification (no OTP required)
router.post('/set-new-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    console.log('🔐 Setting new password for:', email);

    if (!email || !newPassword) {
      return res.status(400).json({ 
        error: 'Email and new password are required' 
      });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    console.log('✅ Password updated successfully for:', email);
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });

  } catch (error) {
    console.error('❌ Set new password error:', error);
    res.status(500).json({
      error: 'Failed to reset password',
      details: error.message
    });
  }
});
// Change password (when user is logged in)
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    console.log('🔐 Password change requested for user ID:', userId);

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'User ID, current password, and new password are required' 
      });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found with ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await User.verifyPassword(currentPassword, user.password);
    if (!isMatch) {
      console.log('❌ Incorrect current password for user ID:', userId);
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    console.log('✅ Password change successful for user ID:', userId);
    res.json({ 
      success: true, 
      message: 'Password has been changed successfully' 
    });

  } catch (error) {
    console.error('❌ Password change error for user ID:', error);
    res.status(500).json({
      error: 'Failed to change password',
      details: error.message
    });
  }
});

// User login with email verification check
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.is_verified) {
      console.log('⚠️ Unverified email attempt:', email);
      
      // Send verification OTP
      await OTP.generateOTP(email, 'email_verification', 10);
      
      return res.status(403).json({ 
        error: 'Email not verified. Please check your email for verification code.',
        requiresVerification: true,
        email: email
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token (you can implement JWT here)
    const token = `auth_token_${Date.now()}_${user.id}`;

    console.log('✅ Login successful for:', email);
    res.json({
      success: true,
      token,
      user: userWithoutPassword,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error during login',
      details: error.message 
    });
  }
});

// Check token validity (optional - for frontend token validation)
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    // In a real app, you'd validate JWT here
    // For now, we'll just return success if token exists
    if (token && token.startsWith('auth_token_')) {
      res.json({ valid: true, message: 'Token is valid' });
    } else {
      res.status(401).json({ valid: false, error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Token validation failed' });
  }
});

export default router;