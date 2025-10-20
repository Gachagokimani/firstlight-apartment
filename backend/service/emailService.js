// backend/services/emailService.js
import transporter, { emailTemplates, otpTemplates } from '../config/emailTemplates.js';

import OTP from '../models/OTP.js';
import dotenv from 'dotenv';
dotenv.config();

class EmailService {
  constructor() {
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    this.rateLimit = new Map(); // Simple in-memory rate limiting
  }

  // Rate limiting check
  checkRateLimit(email, type) {
    const key = `${email}:${type}`;
    const now = Date.now();
    const lastSent = this.rateLimit.get(key);
    
    if (lastSent && (now - lastSent) < 60000) { // 1 minute cooldown
      return false;
    }
    
    this.rateLimit.set(key, now);
    return true;
  }

  // Send OTP email
  async sendOTP(email, userName, type = 'email_verification') {
    try {
      // Rate limiting
      if (!this.checkRateLimit(email, type)) {
        throw new Error('Please wait before requesting another OTP');
      }

      // Check OTP stats (prevent spam)
      const recentOTPs = await OTP.getOTPStats(email, 1); // Last hour
      if (recentOTPs >= 5) {
        throw new Error('Too many OTP requests. Please try again later.');
      }

      // Generate OTP
      const otpRecord = await OTP.generateOTP(email, type);
      
      let template;
      let subject;

      switch (type) {
        case 'email_verification':
          template = otpTemplates.emailVerification;
          subject = `🔐 Verify Your Email - FirstLight Apartments`;
          break;
        case 'password_reset':
          template = otpTemplates.passwordReset;
          subject = `🔄 Password Reset Request - FirstLight Apartments`;
          break;
        case 'two_factor_auth':
          template = otpTemplates.twoFactorAuth;
          subject = `🔒 Two-Factor Authentication Code - FirstLight Apartments`;
          break;
        default:
          throw new Error('Invalid OTP type');
      }

      const emailContent = template({
        userName,
        otp: otpRecord.otp,
        clientUrl: this.clientUrl
      });

      const result = await this.sendEmail(email, subject, emailContent.html);
      
      return {
        success: true,
        message: 'OTP sent successfully',
        otpId: otpRecord.id, // For testing/demo purposes
        // In production, don't return OTP details
      };

    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Verify OTP
  async verifyOTP(email, otp, type = 'email_verification') {
    try {
      const result = await OTP.verifyOTP(email, otp, type);
      return result;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        valid: false,
        message: 'Error verifying OTP'
      };
    }
  }

  // Send email verification OTP
  async sendEmailVerificationOTP(email, userName) {
    return await this.sendOTP(email, userName, 'email_verification');
  }

  // Send password reset OTP
  async sendPasswordResetOTP(email, userName) {
    return await this.sendOTP(email, userName, 'password_reset');
  }

  // Send 2FA OTP
  async send2FAOTP(email, userName) {
    return await this.sendOTP(email, userName, 'two_factor_auth');
  }

  // Existing email sending methods...
  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: `FirstLight Apartments <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        replyTo: process.env.EMAIL_USER,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to} - ${subject}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // ... rest of your existing email methods (sendViewingRequest, etc.)
}

export default new EmailService();