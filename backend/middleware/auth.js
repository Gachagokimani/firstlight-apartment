// backend/routes/auth.js
import express from 'express';
import pool from '../database.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import transporter from '../config/emailTemplates.js';
import { otpTemplates } from '../config/emailTemplates.js';
import bcrypt from 'bcryptjs';
import fileUpload from 'express-fileupload'; // ADD THIS

const router = express.Router();
router.get('/verify-token', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('🔐 Token verification requested');
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({ 
        success: false, 
        error: 'No authorization header' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // Validate token format (auth_token_timestamp_userId)
    if (!token.startsWith('auth_token_')) {
      console.log('❌ Invalid token format:', token);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token format' 
      });
    }

    // Extract user ID from token
    const tokenParts = token.split('_');
    const userId = tokenParts[tokenParts.length - 1];
    
    if (!userId || isNaN(userId)) {
      console.log('❌ Invalid user ID in token');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }

    console.log('🔍 Verifying token for user ID:', userId);

    // Check if user exists and get user data
    const userResult = await pool.query(
      'SELECT id, name, email, phone, is_verified, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found for ID:', userId);
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const user = userResult.rows[0];
    
    console.log('✅ Token valid for user:', user.email);
    
    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        is_verified: user.is_verified
      },
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Token verification failed',
      details: error.message 
    });
  }
});
// ADD FILE UPLOAD MIDDLEWARE
router.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}));

// ===== LISTINGS ROUTES =====
router.post('/listings/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📝 Fetching listings for user ID:', userId);

    const result = await pool.query(
      'SELECT * FROM listings WHERE author_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    console.log(' Listings fetched successfully for user ID:', userId);
    res.json(result.rows);
  } catch (error) {
    console.error(' Error fetching listings for user ID:', error);
    res.status(500).json({ error: 'Failed to fetch user listings' });
  }
});
// Get user stats - FIXED: changed posts to listings
// Get user stats - FIXED SQL SYNTAX
router.get('/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(' Fetching stats for user ID:', userId);
    
    const result = await pool.query(
      `SELECT 
        COUNT(*) AS total_listings,
        COUNT(*) FILTER (WHERE status = 'active') AS active_listings,
        COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_listings,
        COALESCE((
          SELECT COUNT(*) 
          FROM viewing_requests vr 
          JOIN listings p ON vr.listing_id = p.id 
          WHERE p.author_id = $1 AND vr.status = 'pending'
        ), 0) AS pending_requests,
        0 AS total_views
      FROM listings 
      WHERE author_id = $1`,
      [userId]
    );
    
    console.log('Stats fetched successfully for user ID:', userId);
    
    // Transform the response to match frontend expectations
    const stats = result.rows[0];
    const transformedStats = {
      totalListings: parseInt(stats.total_listings) || 0,
      activeListings: parseInt(stats.active_listings) || 0,
      inactiveListings: parseInt(stats.inactive_listings) || 0,
      pendingRequests: parseInt(stats.pending_requests) || 0,
      totalViews: parseInt(stats.total_views) || 0
    };
    
    res.json(transformedStats);
  } catch (error) {
    console.error(' Error fetching stats for user ID:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});
// Get viewing requests for owner - FIXED: changed posts to listings
router.get('/listings/viewing-requests/owner/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(' Fetching viewing requests for owner ID:', userId);
    
    const result = await pool.query(
      `SELECT vr.*, p.title, u.name AS requester_name, u.email AS requester_email
       FROM viewing_requests vr 
       JOIN listings p ON vr.listing_id = p.id 
       JOIN users u ON vr.requester_id = u.id
       WHERE p.author_id = $1
       ORDER BY vr.created_at DESC`, 
      [userId]
    );
    
    console.log('Viewing requests fetched successfully for owner ID:', userId);
    res.json(result.rows);
  } catch (error) {
    console.error(' Error fetching viewing requests for owner:', error);
    res.status(500).json({ error: 'Failed to fetch viewing requests' });
  }
});

// Create new listing - FIXED: changed posts to listings
router.post('/listings', async (req, res) => {
  try {
    const { title, description, price, location, bedrooms, bathrooms, area, propertyType, amenities, availableFrom, contactEmail, contactPhone, images, authorId } = req.body;
    
    console.log(' Creating new listing for author ID:', authorId);
    
    const result = await pool.query(
      `INSERT INTO listings
       (title, description, price, location, bedrooms, bathrooms, area, property_type, amenities, available_from, contact_email, contact_phone, images, author_id, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', NOW()) 
       RETURNING *`,
      [title, description, price, location, bedrooms, bathrooms, area, propertyType, amenities, availableFrom, contactEmail, contactPhone, images, authorId]
    );
    
    console.log(' New listing created successfully with ID:', result.rows[0].id);
    res.json({ success: true, post: result.rows[0] });
  } catch (error) {
    console.error(' Error creating listing:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Update listing - FIXED: parameter name and table name
// Create new listing - REMOVE COMMENTS FROM SQL
router.post('/listings', async (req, res) => {
  try {
    const { title, description, price, location, bedrooms, bathrooms, area, propertyType, amenities, availableFrom, contactEmail, contactPhone, images, authorId } = req.body;
    
    console.log('Creating new listing for author ID:', authorId);
    
    // FIXED: Remove JavaScript comments from SQL query
    const result = await pool.query(
      `INSERT INTO listings 
       (title, description, price, location, bedrooms, bathrooms, area, property_type, amenities, available_from, contact_email, contact_phone, images, author_id, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', NOW()) 
       RETURNING *`,
      [title, description, price, location, bedrooms, bathrooms, area, propertyType, amenities, availableFrom, contactEmail, contactPhone, images, authorId]
    );
    
    console.log('New listing created successfully with ID:', result.rows[0].id);
    res.json({ success: true, post: result.rows[0] });
  } catch (error) {
    console.error(' Error creating listing:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});
router.put('/listings/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const { title, description, price, location, bedrooms, bathrooms, area, propertyType, amenities, availableFrom, contactEmail, contactPhone, images, status } = req.body;
    
    console.log(' Updating listing ID:', listingId);
    
    const result = await pool.query(
      `UPDATE listings SET 
       title = $1, description = $2, price = $3, location = $4, bedrooms = $5, bathrooms = $6, area = $7, 
       property_type = $8, amenities = $9, available_from = $10, contact_email = $11, contact_phone = $12, 
       images = $13, status = $14, updated_at = NOW() 
       WHERE id = $15 RETURNING *`,
      [title, description, price, location, bedrooms, bathrooms, area, propertyType, amenities, availableFrom, contactEmail, contactPhone, images, status, listingId]
    );
    
    console.log(' Listing updated successfully for ID:', listingId);
    res.json({ success: true, post: result.rows[0] });
  } catch (error) {
    console.error(' Error updating listing:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});
router.delete('/listings/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    console.log(' Deleting listing with ID:', listingId);
    
    await pool.query('DELETE FROM listings WHERE id = $1', [listingId]); // CHANGED: posts to listings
    
    console.log(' Listing deleted successfully with ID:', listingId);
    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    console.error(' Error deleting listing:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});
router.get('/listings/viewing-requests/owner/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(' Fetching viewing requests for owner ID:', userId);
    
    const result = await pool.query(
      `SELECT 
        vr.id,
        vr.listing_id,
        vr.requester_id,
        vr.preferred_date,
        vr.message,
        vr.status,
        vr.responded_by,
        vr.responded_at,
        vr.scheduled_date,
        vr.notes,
        vr.created_at,
        vr.updated_at,
        l.title,
        u.name AS requester_name,
        u.email AS requester_email,
        u.phone AS requester_phone
       FROM viewing_requests vr 
       JOIN listings l ON vr.listing_id = l.id
       JOIN users u ON vr.requester_id = u.id
       WHERE l.author_id = $1
       ORDER BY vr.created_at DESC`,
      [userId]
    );
    
    console.log('✅ Viewing requests fetched successfully for owner ID:', userId);
    
    // Transform the response to match frontend expectations
    const transformedRequests = result.rows.map(request => ({
      id: request.id,
      listing_id: request.listing_id,
      requester_id: request.requester_id,
      preferred_date: request.preferred_date,
      message: request.message,
      status: request.status,
      responded_by: request.responded_by,
      responded_at: request.responded_at,
      scheduled_date: request.scheduled_date,
      notes: request.notes,
      created_at: request.created_at,
      updated_at: request.updated_at,
      title: request.title,
      requester_name: request.requester_name,
      requester_email: request.requester_email,
      requester_phone: request.requester_phone
    }));
    
    res.json(transformedRequests);
  } catch (error) {
    console.error(' Error fetching viewing requests for owner:', error);
    res.status(500).json({ error: 'Failed to fetch viewing requests' });
  }
});
// ===== FILE UPLOAD ROUTE =====
router.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    
    const imageFile = req.files.image;
    const uploadPath = `./uploads/${Date.now()}_${imageFile.name}`;
    
    // Ensure uploads directory exists
    const fs = await import('fs');
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    await imageFile.mv(uploadPath);
    console.log(' Image uploaded successfully:', uploadPath);
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: `http://localhost:5000/uploads/${Date.now()}_${imageFile.name}` // Full URL for frontend
    });
  } catch (error) {
    console.error(' Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// ... rest of your auth routes remain the same
// ===== AUTH ROUTES =====

// Send email verification OTP
router.post('/send-verification-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    console.log(' Verification OTP requested for:', email);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    const userName = user ? user.name : (name || 'User');

    // Generate OTP
    const otpRecord = await OTP.generateOTP(email, 'email_verification', 10);
    console.log(' Verification OTP generated:', otpRecord.otp);

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

    console.log(' Verification OTP sent to:', email);
    res.json({ 
      success: true, 
      message: 'Verification OTP sent successfully' 
    });

  } catch (error) {
    console.error(' Send verification OTP error:', error);
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
    console.log(' Password reset OTP requested for:', email);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      console.log(' User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otpRecord = await OTP.generateOTP(email, 'password_reset', 10);
    console.log(' OTP generated:', otpRecord.otp);

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

    console.log(' Password reset OTP sent to:', email);
    res.json({ 
      success: true, 
      message: 'Password reset OTP sent successfully' 
    });

  } catch (error) {
    console.error(' Send password reset OTP error:', error);
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
    console.log('Resend OTP requested for:', email, 'Type:', type);

    if (!email || !type) {
      return res.status(400).json({ error: 'Email and type are required' });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      console.log(' User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otpRecord = await OTP.generateOTP(email, type, 10);
    console.log(' OTP generated:', otpRecord.otp);

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

    console.log('OTP resent to:', email);
    res.json({ 
      success: true, 
      message: 'OTP resent successfully' 
    });

  } catch (error) {
    console.error(' Resend OTP error:', error);
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
    console.log(' OTP verification requested for:', email, 'Type:', type);

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
        console.log(' Email verified for:', email);
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
    console.error(' Verify OTP error:', error);
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
    console.log(' Password reset requested for:', email);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        error: 'Email, OTP, and new password are required' 
      });
    }

    // Verify OTP first
    const otpResult = await OTP.verifyOTP(email, otp, 'password_reset');
    
    if (!otpResult.valid) {
      console.log(' Invalid or expired OTP for:', email);
      return res.status(400).json({ error: otpResult.message });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    console.log(' Password reset successful for:', email);
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });

  } catch (error) {
    console.error(' Password reset error:', error);
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
    console.log(' Password reset OTP verification requested for:', email);
    
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
    console.error(' Verify password reset OTP error:', error);
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
    console.log(' Setting new password for:', email);

    if (!email || !newPassword) {
      return res.status(400).json({ 
        error: 'Email and new password are required' 
      });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      console.log(' User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    console.log(' Password updated successfully for:', email);
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });

  } catch (error) {
    console.error(' Set new password error:', error);
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
    console.log(' Password change requested for user ID:', userId);

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'User ID, current password, and new password are required' 
      });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await User.verifyPassword(currentPassword, user.password);
    if (!isMatch) {
      console.log(' Incorrect current password for user ID:', userId);
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    console.log(' Password change successful for user ID:', userId);
    res.json({ 
      success: true, 
      message: 'Password has been changed successfully' 
    });

  } catch (error) {
    console.error(' Password change error for user ID:', error);
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
    console.log(' Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      console.log(' User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      console.log(' Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.is_verified) {
      console.log(' Unverified email attempt:', email);
      
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

    console.log('Login successful for:', email);
    res.json({
      success: true,
      token,
      user: userWithoutPassword,
      message: 'Login successful'
    });

  } catch (error) {
    console.error(' Login error:', error);
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