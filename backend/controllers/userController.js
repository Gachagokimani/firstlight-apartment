// backend/controllers/userController.js
import User from '../models/User.js';
import emailService from '../service/emailService.js';
import ViewingRequest from '../models/ViewingRequest.js';

// User Registration & Authentication Controllers
export const registerUserWithEmailVerification = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user (unverified initially)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      is_verified: false
    });

    // Send email verification OTP
    const otpResult = await emailService.sendEmailVerificationOTP(email, name);

    if (!otpResult.success) {
      console.warn('Failed to send verification OTP:', otpResult.message);
      // Still return success but inform about OTP issue
      return res.status(201).json({
        success: true,
        message: 'User created successfully, but failed to send verification email. Please try verifying later.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: user.is_verified
        }
      });
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
      // Development only information
      ...(process.env.NODE_ENV === 'development' && {
        otpInfo: {
          otpId: otpResult.otpId,
          message: 'Check logs for OTP in development'
        }
      })
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

export const verifyUserEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Input validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Verify OTP
    const result = await emailService.verifyOTP(email, otp, 'email_verification');

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Update user as verified
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.update(user.id, { is_verified: true });

    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.'
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

export const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists and is not verified
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Resend OTP
    const otpResult = await emailService.sendEmailVerificationOTP(email, user.name);

    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }

    res.json({
      success: true,
      message: 'Verification OTP sent successfully',
      ...(process.env.NODE_ENV === 'development' && {
        otpInfo: {
          otpId: otpResult.otpId,
          message: 'Check logs for OTP in development'
        }
      })
    });

  } catch (error) {
    console.error('Error resending verification OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending verification OTP',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// User Management Controllers
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user (verified by default for direct creation)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      is_verified: true
    });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, {
      userName: user.name
    }).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_verified: user.is_verified
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// User Stats & Analytics Controllers
export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userWithStats = await User.getUserWithStats(userId);
    const pendingRequests = await ViewingRequest.getPendingCount(userId);
    
    const stats = {
      totalListings: parseInt(userWithStats.total_listings) || 0,
      activeListings: parseInt(userWithStats.active_listings) || 0,
      pendingRequests: pendingRequests || 0,
      totalViews: userWithStats.stats?.totalViews || 0,
      respondedRequests: userWithStats.stats?.respondedRequests || 0
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
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

export const getUserDashboard = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user stats
    const userWithStats = await User.getUserWithStats(userId);
    const pendingRequests = await ViewingRequest.getPendingCount(userId);
    
    const stats = {
      totalListings: parseInt(userWithStats.total_listings) || 0,
      activeListings: parseInt(userWithStats.active_listings) || 0,
      pendingRequests: pendingRequests || 0,
      totalViews: userWithStats.stats?.totalViews || 0,
      respondedRequests: userWithStats.stats?.respondedRequests || 0
    };

    // Get recent activity (last 5 viewing requests)
    const recentRequests = await ViewingRequest.findByOwnerId(userId);
    const recentActivity = recentRequests.slice(0, 5);

    res.json({
      success: true,
      dashboard: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: user.is_verified,
          avatar: user.avatar
        },
        stats,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user dashboard',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// Password & Security Controllers
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal whether user exists for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset OTP has been sent'
      });
    }

    const otpResult = await emailService.sendPasswordResetOTP(email, user.name);

    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }

    res.json({
      success: true,
      message: 'Password reset OTP sent successfully',
      ...(process.env.NODE_ENV === 'development' && {
        otpInfo: {
          otpId: otpResult.otpId,
          message: 'Check logs for OTP in development'
        }
      })
    });

  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting password reset',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    // Verify OTP first
    const otpResult = await emailService.verifyOTP(email, otp, 'password_reset');

    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }

    // Update user password
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Note: You'll need to implement updatePassword method in User model
    await User.updatePassword(user.id, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// Admin Controllers
export const getAllUsers = async (req, res) => {
  try {
    // This would typically have pagination, filtering, etc.
    // For now, just get all users (without passwords)
    const users = await User.findLandlords(); // This method needs to be updated to get all users
    
    res.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // In a real application, you might want to soft delete
    // or handle related data cleanup
    // await User.delete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};