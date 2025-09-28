const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/emailService');
const { generateTokenResponse, clearTokenCookie } = require('../utils/tokenUtils');
const { notificationQueue } = require('../../notifications/NotificationQueue');

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user
    const userData = {
      email,
      password,
      role,
      profile: {}
    };

    if (firstName) userData.profile.firstName = firstName;
    if (lastName) userData.profile.lastName = lastName;

    const user = await User.create(userData);

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Queue welcome email and verification
    try {
      await notificationQueue.queueWelcomeEmail(
        user._id,
        user.email,
        user.profile.firstName || 'User',
        user.role
      );

      logger.info(`Welcome email queued for ${user.email}`);
    } catch (error) {
      logger.error('Error queueing welcome email:', error);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        error: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });

    logger.info(`User ${user.email} logged in successfully`);

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        profile: user.profile,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from user's tokens
      req.user.refreshTokens = req.user.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );
      await req.user.save({ validateBeforeSave: false });
    }

    logger.info(`User ${req.user.email} logged out`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { user, refreshToken: currentRefreshToken } = req;

    // Generate new tokens
    const newToken = user.getSignedJwtToken();
    const newRefreshToken = user.generateRefreshToken();

    // Remove old refresh token
    user.refreshTokens = user.refreshTokens.filter(
      tokenObj => tokenObj.token !== currentRefreshToken
    );

    await user.save({ validateBeforeSave: false });

    logger.info(`Tokens refreshed for user ${user.email}`);

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    next(error);
  }
};

/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    // Verify user
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    logger.info(`Email verified for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    next(error);
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
const resendVerification = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      await sendEmail({
        to: user.email,
        subject: 'Please verify your email',
        template: 'emailVerification',
        data: {
          name: user.profile.firstName || 'User',
          verificationUrl,
          supportEmail: process.env.SUPPORT_EMAIL
        }
      });

      logger.info(`Verification email resent to ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });

    } catch (error) {
      logger.error('Error sending verification email:', error);
      return res.status(500).json({
        success: false,
        error: 'Error sending verification email'
      });
    }

  } catch (error) {
    logger.error('Resend verification error:', error);
    next(error);
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user found with that email'
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        template: 'passwordReset',
        data: {
          name: user.profile.firstName || 'User',
          resetUrl,
          supportEmail: process.env.SUPPORT_EMAIL
        }
      });

      logger.info(`Password reset email sent to ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });

    } catch (error) {
      logger.error('Error sending password reset email:', error);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        error: 'Error sending password reset email'
      });
    }

  } catch (error) {
    logger.error('Forgot password error:', error);
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Clear all refresh tokens for security
    user.refreshTokens = [];
    
    await user.save();

    logger.info(`Password reset for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
};

/**
 * @desc    Send OTP
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user found with that email'
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    // Queue OTP email
    try {
      await notificationQueue.queueOTPVerification(
        user._id,
        user.email,
        user.profile.firstName || 'User',
        otp
      );

      logger.info(`OTP queued for ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully'
      });

    } catch (error) {
      logger.error('Error queueing OTP email:', error);
      return res.status(500).json({
        success: false,
        error: 'Error sending OTP'
      });
    }

  } catch (error) {
    logger.error('Send OTP error:', error);
    next(error);
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user found with that email'
      });
    }

    try {
      user.verifyOTP(otp);
      await user.save({ validateBeforeSave: false });

      logger.info(`OTP verified for user ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
      });

    } catch (error) {
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

  } catch (error) {
    logger.error('Verify OTP error:', error);
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    
    // Clear all refresh tokens for security
    user.refreshTokens = [];
    
    await user.save();

    logger.info(`Password changed for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        profile: user.profile,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    logger.error('Get me error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendOTP,
  verifyOTP,
  changePassword,
  getMe
};
