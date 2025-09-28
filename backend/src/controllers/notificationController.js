const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');
const { notificationService } = require('../../notifications/NotificationService');
const { notificationQueue } = require('../../notifications/NotificationQueue');
const { cronJobManager } = require('../../jobs/cronJobs');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const status = req.query.status;

    const notifications = await Notification.findByRecipient(req.user.id, {
      type,
      status,
      limit,
      skip: (page - 1) * limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    const total = await Notification.countDocuments({
      recipientId: req.user.id,
      ...(type && { type }),
      ...(status && { status })
    });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get notifications error:', error);
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:notificationId/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check ownership
    if (notification.recipientId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    logger.error('Mark notification as read error:', error);
    next(error);
  }
};

/**
 * @desc    Handle AMP form submission for profile updates
 * @route   POST /api/notifications/amp/profile-update
 * @access  Public (with token verification)
 */
const handleAMPProfileUpdate = async (req, res, next) => {
  try {
    const { token, currentPosition, newSkills, jobTypes, salaryRange } = req.body;

    // Verify AMP token
    const tokenVerification = notificationService.verifyAMPToken(token);
    
    if (!tokenVerification.valid) {
      return res.status(400).json({
        success: false,
        error: tokenVerification.error
      });
    }

    const { recipientId } = tokenVerification;

    // Get user
    const user = await User.findById(recipientId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user profile
    const updates = {};

    if (currentPosition) {
      if (!user.profile.experience) user.profile.experience = [];
      
      // Update current position or add new one
      const currentExp = user.profile.experience.find(exp => exp.current);
      if (currentExp) {
        currentExp.position = currentPosition;
      } else {
        user.profile.experience.unshift({
          position: currentPosition,
          company: 'Current Company',
          current: true,
          startDate: new Date()
        });
      }
    }

    if (newSkills) {
      const skillsArray = newSkills.split(',').map(skill => skill.trim()).filter(Boolean);
      if (!user.profile.skills) user.profile.skills = [];
      
      // Add new skills (avoid duplicates)
      skillsArray.forEach(skill => {
        if (!user.profile.skills.includes(skill)) {
          user.profile.skills.push(skill);
        }
      });
    }

    if (jobTypes) {
      if (!user.profile.preferences) user.profile.preferences = {};
      user.profile.preferences.jobTypes = Array.isArray(jobTypes) ? jobTypes : [jobTypes];
    }

    if (salaryRange) {
      if (!user.profile.preferences) user.profile.preferences = {};
      const [min, max] = salaryRange.includes('-') 
        ? salaryRange.split('-').map(s => parseInt(s.replace(/[^\d]/g, '')))
        : [parseInt(salaryRange.replace(/[^\d]/g, '')), null];
      
      user.profile.preferences.expectedSalary = {
        min,
        max: max || undefined,
        currency: 'USD'
      };
    }

    await user.save();

    logger.info(`Profile updated via AMP form for user ${user.email}`);

    // Send success response for AMP
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profileCompletion: user.profile.profileCompletion,
        updatedFields: Object.keys(updates)
      }
    });

  } catch (error) {
    logger.error('AMP profile update error:', error);
    
    // Send error response for AMP
    res.status(400).json({
      success: false,
      error: error.message || 'Profile update failed'
    });
  }
};

/**
 * @desc    Handle unsubscribe request
 * @route   GET /api/notifications/unsubscribe/:token
 * @access  Public
 */
const handleUnsubscribe = async (req, res, next) => {
  try {
    const { token } = req.params;

    const notification = await Notification.findOne({ unsubscribeToken: token });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Invalid unsubscribe token'
      });
    }

    await notification.handleUnsubscribe();

    // Update user preferences to disable notifications of this type
    const user = await User.findById(notification.recipientId);
    if (user) {
      if (!user.profile.preferences) user.profile.preferences = {};
      if (!user.profile.preferences.notifications) user.profile.preferences.notifications = {};
      
      user.profile.preferences.notifications[notification.type] = false;
      await user.save();
    }

    logger.info(`User unsubscribed from ${notification.type} notifications: ${notification.recipientId}`);

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from notifications'
    });

  } catch (error) {
    logger.error('Unsubscribe error:', error);
    next(error);
  }
};

/**
 * @desc    Get all notifications (Admin only)
 * @route   GET /api/notifications/admin/all
 * @access  Private (Admin)
 */
const getAllNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;
    if (req.query.channel) query.channel = req.query.channel;
    if (req.query.priority) query.priority = req.query.priority;

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
    }

    const notifications = await Notification.find(query)
      .populate('recipientId', 'profile.firstName profile.lastName email role')
      .populate('metadata.jobId', 'title company.name')
      .populate('metadata.resumeId', 'originalName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    // Get statistics
    const stats = await Notification.getStats(query);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    logger.error('Get all notifications error:', error);
    next(error);
  }
};

/**
 * @desc    Retry failed notification
 * @route   POST /api/notifications/admin/:notificationId/retry
 * @access  Private (Admin)
 */
const retryNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (!notification.canRetry) {
      return res.status(400).json({
        success: false,
        error: 'Notification cannot be retried'
      });
    }

    await notification.retry();
    
    // Queue for processing
    await notificationQueue.queueEmail(notification.toObject());

    logger.info(`Notification retry queued: ${notification._id}`);

    res.status(200).json({
      success: true,
      message: 'Notification retry queued successfully'
    });

  } catch (error) {
    logger.error('Retry notification error:', error);
    next(error);
  }
};

/**
 * @desc    Get notification statistics
 * @route   GET /api/notifications/admin/stats
 * @access  Private (Admin)
 */
const getNotificationStats = async (req, res, next) => {
  try {
    const { startDate, endDate, type, channel } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (type) filter.type = type;
    if (channel) filter.channel = channel;

    // Get basic stats
    const basicStats = await Notification.getStats(filter);

    // Get delivery rates
    const deliveryStats = await Notification.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          avgProcessingTime: { $avg: '$processingTime' }
        }
      }
    ]);

    // Get queue stats
    const queueStats = await notificationQueue.getStats();

    // Get recent activity
    const recentActivity = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type status createdAt sentAt errorMessage')
      .populate('recipientId', 'profile.firstName profile.lastName email');

    res.status(200).json({
      success: true,
      data: {
        basic: basicStats,
        delivery: deliveryStats,
        queue: queueStats,
        recent: recentActivity,
        period: {
          startDate,
          endDate,
          type,
          channel
        }
      }
    });

  } catch (error) {
    logger.error('Get notification stats error:', error);
    next(error);
  }
};

/**
 * @desc    Send test notification
 * @route   POST /api/notifications/admin/test
 * @access  Private (Admin)
 */
const sendTestNotification = async (req, res, next) => {
  try {
    const { type, recipientEmail, templateData = {} } = req.body;

    // Find recipient user
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    // Send test notification
    let result;
    
    switch (type) {
      case 'otp_verification':
        result = await notificationService.sendOTPVerification(
          recipient._id,
          recipient.email,
          recipient.profile.fullName || recipient.email,
          '123456' // Test OTP
        );
        break;
        
      case 'welcome':
        result = await notificationService.sendWelcomeEmail(
          recipient._id,
          recipient.email,
          recipient.profile.fullName || recipient.email,
          recipient.role
        );
        break;
        
      case 'resume_refresh_reminder':
        result = await notificationService.sendResumeRefreshReminder(
          recipient._id,
          recipient.email,
          recipient.profile.fullName || recipient.email,
          {
            lastProfileUpdate: recipient.profile.lastProfileUpdate || new Date(),
            profileCompletion: recipient.profile.profileCompletion || 50,
            suggestions: ['Complete your profile', 'Add more skills'],
            matchingJobs: 5
          }
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported test notification type'
        });
    }

    logger.info(`Test notification sent: ${type} to ${recipientEmail}`);

    res.status(200).json({
      success: true,
      message: 'Test notification sent successfully',
      data: result
    });

  } catch (error) {
    logger.error('Send test notification error:', error);
    next(error);
  }
};

/**
 * @desc    Get notification queue status
 * @route   GET /api/notifications/admin/queue/status
 * @access  Private (Admin)
 */
const getQueueStatus = async (req, res, next) => {
  try {
    const queueHealth = await notificationQueue.getHealth();
    const serviceHealth = await notificationService.healthCheck();

    res.status(200).json({
      success: true,
      data: {
        queue: queueHealth,
        service: serviceHealth,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get queue status error:', error);
    next(error);
  }
};

/**
 * @desc    Retry all failed notifications
 * @route   POST /api/notifications/admin/retry-all
 * @access  Private (Admin)
 */
const retryAllFailed = async (req, res, next) => {
  try {
    const result = await notificationQueue.retryAllFailedJobs();

    logger.info(`Retried all failed notifications: ${result.retried}/${result.total}`);

    res.status(200).json({
      success: true,
      message: 'Failed notifications retry initiated',
      data: result
    });

  } catch (error) {
    logger.error('Retry all failed notifications error:', error);
    next(error);
  }
};

/**
 * @desc    Pause notification queue
 * @route   POST /api/notifications/admin/queue/pause
 * @access  Private (Admin)
 */
const pauseQueue = async (req, res, next) => {
  try {
    await notificationQueue.pauseQueue();

    res.status(200).json({
      success: true,
      message: 'Notification queue paused'
    });

  } catch (error) {
    logger.error('Pause queue error:', error);
    next(error);
  }
};

/**
 * @desc    Resume notification queue
 * @route   POST /api/notifications/admin/queue/resume
 * @access  Private (Admin)
 */
const resumeQueue = async (req, res, next) => {
  try {
    await notificationQueue.resumeQueue();

    res.status(200).json({
      success: true,
      message: 'Notification queue resumed'
    });

  } catch (error) {
    logger.error('Resume queue error:', error);
    next(error);
  }
};

/**
 * @desc    Get cron job status
 * @route   GET /api/notifications/admin/cron/status
 * @access  Private (Admin)
 */
const getCronStatus = async (req, res, next) => {
  try {
    const status = cronJobManager.getStatus();

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Get cron status error:', error);
    next(error);
  }
};

/**
 * @desc    Trigger manual cron job
 * @route   POST /api/notifications/admin/cron/:jobName/trigger
 * @access  Private (Admin)
 */
const triggerCronJob = async (req, res, next) => {
  try {
    const { jobName } = req.params;

    let result;
    
    switch (jobName) {
      case 'weeklyReminders':
        await cronJobManager.triggerWeeklyReminders();
        result = 'Weekly reminders triggered';
        break;
        
      case 'jobMatching':
        await cronJobManager.triggerJobMatching();
        result = 'Job matching triggered';
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown cron job name'
        });
    }

    logger.info(`Manual cron job triggered: ${jobName} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: result
    });

  } catch (error) {
    logger.error(`Trigger cron job error (${req.params.jobName}):`, error);
    next(error);
  }
};

/**
 * @desc    Update notification preferences
 * @route   PUT /api/notifications/preferences
 * @access  Private
 */
const updateNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Initialize preferences if not exist
    if (!user.profile.preferences) user.profile.preferences = {};
    if (!user.profile.preferences.notifications) user.profile.preferences.notifications = {};

    // Update notification preferences
    const allowedPreferences = [
      'job_match',
      'resume_refresh_reminder',
      'application_status',
      'interview_scheduled',
      'profile_completion',
      'job_alert'
    ];

    allowedPreferences.forEach(pref => {
      if (req.body[pref] !== undefined) {
        user.profile.preferences.notifications[pref] = req.body[pref];
      }
    });

    await user.save();

    logger.info(`Notification preferences updated for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: user.profile.preferences.notifications
    });

  } catch (error) {
    logger.error('Update notification preferences error:', error);
    next(error);
  }
};

/**
 * @desc    Get notification preferences
 * @route   GET /api/notifications/preferences
 * @access  Private
 */
const getNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const preferences = user.profile.preferences?.notifications || {
      job_match: true,
      resume_refresh_reminder: true,
      application_status: true,
      interview_scheduled: true,
      profile_completion: true,
      job_alert: true
    };

    res.status(200).json({
      success: true,
      data: preferences
    });

  } catch (error) {
    logger.error('Get notification preferences error:', error);
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  handleAMPProfileUpdate,
  handleUnsubscribe,
  getAllNotifications,
  retryNotification,
  getNotificationStats,
  sendTestNotification,
  getQueueStatus,
  retryAllFailed,
  pauseQueue,
  resumeQueue,
  getCronStatus,
  triggerCronJob,
  updateNotificationPreferences,
  getNotificationPreferences
};
