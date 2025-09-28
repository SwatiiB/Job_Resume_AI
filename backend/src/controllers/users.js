const User = require('../models/User');
const logger = require('../utils/logger');
const { deleteFile, getFileUrl } = require('../middleware/upload');
const path = require('path');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      profile: user.profile,
      profileCompletion: user.profile.profileCompletion,
      lastProfileUpdate: user.profile.lastProfileUpdate
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update profile fields
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'skills', 'experience', 
      'education', 'certifications', 'location'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user.profile[field] = req.body[field];
      }
    });

    // Validate experience dates
    if (req.body.experience) {
      for (const exp of req.body.experience) {
        if (exp.startDate && exp.endDate && !exp.current) {
          if (new Date(exp.startDate) > new Date(exp.endDate)) {
            return res.status(400).json({
              success: false,
              error: 'Experience start date cannot be after end date'
            });
          }
        }
      }
    }

    // Validate education dates
    if (req.body.education) {
      for (const edu of req.body.education) {
        if (edu.startDate && edu.endDate && !edu.current) {
          if (new Date(edu.startDate) > new Date(edu.endDate)) {
            return res.status(400).json({
              success: false,
              error: 'Education start date cannot be after end date'
            });
          }
        }
      }
    }

    await user.save();

    logger.info(`Profile updated for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: user.profile,
      profileCompletion: user.profile.profileCompletion
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

/**
 * @desc    Upload user avatar
 * @route   POST /api/users/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      // Clean up uploaded file
      deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete old avatar if exists
    if (user.profile.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.profile.avatar));
      deleteFile(oldAvatarPath);
    }

    // Update user avatar
    user.profile.avatar = getFileUrl(req.file.filename, 'avatars');
    await user.save({ validateBeforeSave: false });

    logger.info(`Avatar uploaded for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: user.profile.avatar
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      deleteFile(req.file.path);
    }
    logger.error('Upload avatar error:', error);
    next(error);
  }
};

/**
 * @desc    Delete user avatar
 * @route   DELETE /api/users/avatar
 * @access  Private
 */
const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.profile.avatar) {
      return res.status(400).json({
        success: false,
        error: 'No avatar to delete'
      });
    }

    // Delete avatar file
    const avatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.profile.avatar));
    deleteFile(avatarPath);

    // Remove avatar from user profile
    user.profile.avatar = null;
    await user.save({ validateBeforeSave: false });

    logger.info(`Avatar deleted for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Avatar deleted successfully'
    });

  } catch (error) {
    logger.error('Delete avatar error:', error);
    next(error);
  }
};

/**
 * @desc    Get profile completion percentage
 * @route   GET /api/users/profile/completion
 * @access  Private
 */
const getProfileCompletion = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Force recalculation of profile completion
    const completionPercentage = user.calculateProfileCompletion();

    res.status(200).json({
      success: true,
      profileCompletion: completionPercentage,
      lastProfileUpdate: user.profile.lastProfileUpdate,
      suggestions: getProfileCompletionSuggestions(user)
    });

  } catch (error) {
    logger.error('Get profile completion error:', error);
    next(error);
  }
};

/**
 * Get profile completion suggestions
 */
const getProfileCompletionSuggestions = (user) => {
  const suggestions = [];

  if (user.role !== 'candidate') return suggestions;

  if (!user.profile.firstName) suggestions.push('Add your first name');
  if (!user.profile.lastName) suggestions.push('Add your last name');
  if (!user.profile.phone) suggestions.push('Add your phone number');
  if (!user.profile.avatar) suggestions.push('Upload a profile picture');
  if (!user.profile.location || !user.profile.location.city) suggestions.push('Add your location');
  
  if (!user.profile.skills || user.profile.skills.length === 0) {
    suggestions.push('Add your skills');
  } else if (user.profile.skills.length < 5) {
    suggestions.push('Add more skills (at least 5 recommended)');
  }

  if (!user.profile.experience || user.profile.experience.length === 0) {
    suggestions.push('Add your work experience');
  } else if (user.profile.experience.length < 2) {
    suggestions.push('Add more work experience');
  } else if (!user.profile.experience.some(exp => exp.description)) {
    suggestions.push('Add descriptions to your work experience');
  }

  if (!user.profile.education || user.profile.education.length === 0) {
    suggestions.push('Add your education');
  } else if (!user.profile.education.some(edu => edu.description)) {
    suggestions.push('Add descriptions to your education');
  }

  if (!user.profile.preferences || !user.profile.preferences.jobTypes || user.profile.preferences.jobTypes.length === 0) {
    suggestions.push('Set your job type preferences');
  }

  if (!user.profile.preferences || !user.profile.preferences.workModes || user.profile.preferences.workModes.length === 0) {
    suggestions.push('Set your work mode preferences');
  }

  if (!user.profile.preferences || !user.profile.preferences.expectedSalary || !user.profile.preferences.expectedSalary.min) {
    suggestions.push('Set your expected salary range');
  }

  return suggestions;
};

/**
 * @desc    Update user preferences
 * @route   PUT /api/users/preferences
 * @access  Private
 */
const updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Initialize preferences if not exists
    if (!user.profile.preferences) {
      user.profile.preferences = {};
    }

    // Update preferences
    const allowedFields = [
      'jobTypes', 'workModes', 'expectedSalary', 'willingToRelocate', 'availabilityDate'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user.profile.preferences[field] = req.body[field];
      }
    });

    // Validate expected salary
    if (req.body.expectedSalary) {
      const { min, max } = req.body.expectedSalary;
      if (min && max && min > max) {
        return res.status(400).json({
          success: false,
          error: 'Minimum expected salary cannot be greater than maximum'
        });
      }
    }

    await user.save();

    logger.info(`Preferences updated for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.profile.preferences
    });

  } catch (error) {
    logger.error('Update preferences error:', error);
    next(error);
  }
};

/**
 * @desc    Deactivate user account
 * @route   PUT /api/users/deactivate
 * @access  Private
 */
const deactivateAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.isActive = false;
    user.refreshTokens = []; // Clear all refresh tokens
    await user.save({ validateBeforeSave: false });

    logger.info(`Account deactivated for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    logger.error('Deactivate account error:', error);
    next(error);
  }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.isVerified !== undefined) {
      query.isVerified = req.query.isVerified === 'true';
    }
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const users = await User.find(query)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken -otpCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:userId
 * @access  Private (Owner or Admin)
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken -otpCode');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Update user role (Admin only)
 * @route   PUT /api/users/:userId/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });

    logger.info(`Role updated to ${role} for user ${user.email} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('Update user role error:', error);
    next(error);
  }
};

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private (Admin/Recruiter)
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q, skills, location, role = 'candidate', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    const query = { role };

    if (q) {
      query.$or = [
        { 'profile.firstName': { $regex: q, $options: 'i' } },
        { 'profile.lastName': { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query['profile.skills'] = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }

    if (location) {
      query.$or = query.$or || [];
      query.$or.push(
        { 'profile.location.city': { $regex: location, $options: 'i' } },
        { 'profile.location.state': { $regex: location, $options: 'i' } },
        { 'profile.location.country': { $regex: location, $options: 'i' } }
      );
    }

    const users = await User.find(query)
      .select('profile email createdAt')
      .sort({ 'profile.profileCompletion': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Search users error:', error);
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getProfileCompletion,
  updatePreferences,
  deactivateAccount,
  getAllUsers,
  getUserById,
  updateUserRole,
  searchUsers
};
