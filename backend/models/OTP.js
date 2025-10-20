// backend/models/OTP.js
import pool from '../database.js';
import crypto from 'crypto';

class OTP {
  // Generate and store OTP
  static async generateOTP(email, type = 'email_verification', expiresInMinutes = 10) {
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    // Invalidate any existing OTPs for this email and type
    await this.invalidateExistingOTPs(email, type);
    
    const query = `
      INSERT INTO otps (email, otp, type, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [email, otp, type, expiresAt];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Verify OTP
  static async verifyOTP(email, otp, type = 'email_verification') {
    const query = `
      SELECT * FROM otps 
      WHERE email = $1 AND otp = $2 AND type = $3 AND used = false AND expires_at > NOW()
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const result = await pool.query(query, [email, otp, type]);
    
    if (result.rows.length === 0) {
      return { valid: false, message: 'Invalid or expired OTP' };
    }
    
    const otpRecord = result.rows[0];
    
    // Mark OTP as used
    await this.markAsUsed(otpRecord.id);
    
    return { valid: true, message: 'OTP verified successfully' };
  }

  // Invalidate existing OTPs for an email and type
  static async invalidateExistingOTPs(email, type) {
    const query = `
      UPDATE otps 
      SET used = true 
      WHERE email = $1 AND type = $2 AND used = false
    `;
    
    await pool.query(query, [email, type]);
  }

  // Mark OTP as used
  static async markAsUsed(otpId) {
    const query = 'UPDATE otps SET used = true, used_at = NOW() WHERE id = $1';
    await pool.query(query, [otpId]);
  }

  // Check if OTP exists and is valid
  static async isValidOTP(email, otp, type) {
    const query = `
      SELECT COUNT(*) as count 
      FROM otps 
      WHERE email = $1 AND otp = $2 AND type = $3 AND used = false AND expires_at > NOW()
    `;
    
    const result = await pool.query(query, [email, otp, type]);
    return parseInt(result.rows[0].count) > 0;
  }

  // Clean up expired OTPs (can be run as a cron job)
  static async cleanupExpiredOTPs() {
    const query = 'DELETE FROM otps WHERE expires_at < NOW() - INTERVAL \'1 day\'';
    const result = await pool.query(query);
    return result.rowCount;
  }

  // Get OTP stats for an email (rate limiting)
  static async getOTPStats(email, hours = 1) {
    const query = `
      SELECT COUNT(*) as count 
      FROM otps 
      WHERE email = $1 AND created_at > NOW() - INTERVAL \'${hours} hours\'
    `;
    
    const result = await pool.query(query, [email]);
    return parseInt(result.rows[0].count);
  }
}

export default OTP;