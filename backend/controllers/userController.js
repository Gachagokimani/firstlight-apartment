// backend/controllers/userController.js
import User from '../models/User.js';
import emailService from '../service/emailService.js';
// backend/controllers/userController.js
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import ViewingRequest from '../models/ViewingRequest.js';
export const registerUserWithEmailVerification = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    // Create user (unverified initially)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      is_verified: false // Start as unverified
    });

    // Send email verification OTP
    const otpResult = await emailService.sendEmailVerificationOTP(email, name);

    if (!otpResult.success) {
      // Still create user but log the error
      console.error('Failed to send verification OTP:', otpResult.message);
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully. Please verify your email.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_verified: user.is_verified
      },
      // For development only
      otpInfo: process.env.NODE_ENV === 'development' ? {
        otpId: otpResult.otpId,
        message: 'Check logs for OTP in development'
      } : undefined
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Add to your existing userController
export const verifyUserEmail = async (req, res) => {
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
    const user = await User.findByEmail(email);
    if (user) {
      await User.update(user.id, { is_verified: true });
    }

    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.'
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
};
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, {
      userName: user.name
    }).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    // In a real app, you'd generate a JWT token here
    // const token = generateAuthToken(user);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
      // token
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.update(id, updateData);

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userWithStats = await User.getUserWithStats(userId);
    const pendingRequests = await ViewingRequest.getPendingCount(userId);
    
    const stats = {
      totalListings: parseInt(userWithStats.total_listings) || 0,
      activeListings: parseInt(userWithStats.active_listings) || 0,
      pendingRequests: pendingRequests,
      totalViews: userWithStats.stats?.totalViews || 0
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats',
      error: error.message
    });
  }
};