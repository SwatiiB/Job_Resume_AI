const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - recipientId
 *         - type
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ObjectId
 *         recipientId:
 *           type: string
 *           description: User ID of the recipient
 *         type:
 *           type: string
 *           enum: [otp_verification, job_match, resume_refresh_reminder, welcome, password_reset, application_status, interview_scheduled]
 *           description: Type of notification
 *         status:
 *           type: string
 *           enum: [pending, sent, delivered, failed, bounced]
 *           default: pending
 *           description: Notification delivery status
 *         channel:
 *           type: string
 *           enum: [email, sms, push, in_app]
 *           default: email
 *           description: Delivery channel
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *           default: normal
 *           description: Notification priority
 *         subject:
 *           type: string
 *           description: Email subject or notification title
 *         content:
 *           type: object
 *           description: Notification content and template data
 *         metadata:
 *           type: object
 *           description: Additional metadata for the notification
 *         templateId:
 *           type: string
 *           description: Template identifier used for this notification
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           description: When the notification should be sent
 *         sentAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was actually sent
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was delivered
 *         readAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was read (if trackable)
 *         retryCount:
 *           type: number
 *           default: 0
 *           description: Number of retry attempts
 *         maxRetries:
 *           type: number
 *           default: 3
 *           description: Maximum retry attempts
 *         errorMessage:
 *           type: string
 *           description: Error message if notification failed
 *         externalId:
 *           type: string
 *           description: External service ID (Brevo message ID, etc.)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required'],
    index: true
  },
  
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'otp_verification',
      'job_match',
      'resume_refresh_reminder',
      'welcome',
      'password_reset',
      'application_status',
      'interview_scheduled',
      'profile_completion',
      'job_alert',
      'resume_analysis_complete'
    ],
    index: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'in_app'],
    default: 'email',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  
  content: {
    // Template variables and data
    templateData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // Rendered content (cached after template processing)
    htmlContent: String,
    textContent: String,
    ampContent: String, // For AMP emails
    
    // Personalization data
    personalization: {
      name: String,
      firstName: String,
      lastName: String,
      email: String,
      customData: mongoose.Schema.Types.Mixed
    }
  },
  
  metadata: {
    // Job-related metadata
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume'
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application'
    },
    
    // Matching and AI metadata
    matchScore: Number,
    aiSuggestions: [String],
    
    // Campaign and tracking
    campaignId: String,
    source: String,
    medium: String,
    
    // Additional context
    context: mongoose.Schema.Types.Mixed
  },
  
  templateId: {
    type: String,
    required: [true, 'Template ID is required'],
    trim: true
  },
  
  // Scheduling
  scheduledAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  clickedAt: Date,
  
  // Retry logic
  retryCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  maxRetries: {
    type: Number,
    default: 3,
    min: 0,
    max: 10
  },
  
  nextRetryAt: Date,
  
  // Error handling
  errorMessage: String,
  errorCode: String,
  errorDetails: mongoose.Schema.Types.Mixed,
  
  // External service integration
  externalId: String, // Brevo message ID, etc.
  externalStatus: String,
  externalResponse: mongoose.Schema.Types.Mixed,
  
  // Tracking and analytics
  tracking: {
    opened: {
      type: Boolean,
      default: false
    },
    openedAt: Date,
    openCount: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Boolean,
      default: false
    },
    clickedAt: Date,
    clickCount: {
      type: Number,
      default: 0
    },
    unsubscribed: {
      type: Boolean,
      default: false
    },
    unsubscribedAt: Date,
    bounced: {
      type: Boolean,
      default: false
    },
    bouncedAt: Date,
    bounceReason: String
  },
  
  // Batch processing
  batchId: String,
  batchSize: Number,
  
  // Compliance and preferences
  userConsent: {
    type: Boolean,
    default: true
  },
  
  unsubscribeToken: String,
  
  // Performance metrics
  processingTime: Number, // milliseconds
  queueTime: Number, // milliseconds
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Each tag cannot exceed 50 characters']
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
notificationSchema.index({ recipientId: 1, type: 1 });
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'metadata.jobId': 1 });
notificationSchema.index({ 'metadata.resumeId': 1 });
notificationSchema.index({ batchId: 1 });
notificationSchema.index({ externalId: 1 });
notificationSchema.index({ nextRetryAt: 1, status: 1 });

// Compound indexes for common queries
notificationSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1, scheduledAt: 1 });
notificationSchema.index({ priority: 1, status: 1, scheduledAt: 1 });

// Virtual for recipient details
notificationSchema.virtual('recipient', {
  ref: 'User',
  localField: 'recipientId',
  foreignField: '_id',
  justOne: true
});

// Virtual for job details
notificationSchema.virtual('job', {
  ref: 'Job',
  localField: 'metadata.jobId',
  foreignField: '_id',
  justOne: true
});

// Virtual for resume details
notificationSchema.virtual('resume', {
  ref: 'Resume',
  localField: 'metadata.resumeId',
  foreignField: '_id',
  justOne: true
});

// Virtual for delivery status
notificationSchema.virtual('isDelivered').get(function() {
  return ['sent', 'delivered'].includes(this.status);
});

// Virtual for retry eligibility
notificationSchema.virtual('canRetry').get(function() {
  return this.status === 'failed' && this.retryCount < this.maxRetries;
});

// Virtual for time since creation
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for formatted status
notificationSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Pending',
    'sent': 'Sent',
    'delivered': 'Delivered',
    'failed': 'Failed',
    'bounced': 'Bounced',
    'cancelled': 'Cancelled'
  };
  return statusMap[this.status] || this.status;
});

// Pre-save middleware to generate unsubscribe token
notificationSchema.pre('save', function(next) {
  if (this.isNew && this.channel === 'email' && !this.unsubscribeToken) {
    const crypto = require('crypto');
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Pre-save middleware to update retry schedule
notificationSchema.pre('save', function(next) {
  if (this.isModified('retryCount') && this.status === 'failed' && this.canRetry) {
    const baseDelay = parseInt(process.env.NOTIFICATION_RETRY_DELAY) || 5000;
    const exponentialDelay = baseDelay * Math.pow(2, this.retryCount);
    this.nextRetryAt = new Date(Date.now() + exponentialDelay);
  }
  next();
});

// Method to mark as sent
notificationSchema.methods.markAsSent = function(externalId = null, externalResponse = null) {
  this.status = 'sent';
  this.sentAt = new Date();
  if (externalId) this.externalId = externalId;
  if (externalResponse) this.externalResponse = externalResponse;
  return this.save();
};

// Method to mark as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Method to mark as failed
notificationSchema.methods.markAsFailed = function(errorMessage, errorCode = null, errorDetails = null) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  if (errorCode) this.errorCode = errorCode;
  if (errorDetails) this.errorDetails = errorDetails;
  this.retryCount++;
  return this.save();
};

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.readAt = new Date();
  this.tracking.opened = true;
  this.tracking.openedAt = new Date();
  this.tracking.openCount++;
  return this.save();
};

// Method to track click
notificationSchema.methods.trackClick = function() {
  this.clickedAt = new Date();
  this.tracking.clicked = true;
  this.tracking.clickedAt = new Date();
  this.tracking.clickCount++;
  return this.save();
};

// Method to handle unsubscribe
notificationSchema.methods.handleUnsubscribe = function() {
  this.tracking.unsubscribed = true;
  this.tracking.unsubscribedAt = new Date();
  return this.save();
};

// Method to handle bounce
notificationSchema.methods.handleBounce = function(bounceReason = null) {
  this.status = 'bounced';
  this.tracking.bounced = true;
  this.tracking.bouncedAt = new Date();
  if (bounceReason) this.tracking.bounceReason = bounceReason;
  return this.save();
};

// Method to cancel notification
notificationSchema.methods.cancel = function(reason = null) {
  this.status = 'cancelled';
  if (reason) this.errorMessage = reason;
  return this.save();
};

// Method to retry notification
notificationSchema.methods.retry = function() {
  if (!this.canRetry) {
    throw new Error('Notification cannot be retried');
  }
  
  this.status = 'pending';
  this.errorMessage = null;
  this.errorCode = null;
  this.errorDetails = null;
  this.nextRetryAt = null;
  
  return this.save();
};

// Static method to find notifications ready for retry
notificationSchema.statics.findReadyForRetry = function() {
  return this.find({
    status: 'failed',
    nextRetryAt: { $lte: new Date() },
    retryCount: { $lt: this.maxRetries }
  });
};

// Static method to find pending notifications
notificationSchema.statics.findPending = function(limit = 100) {
  return this.find({
    status: 'pending',
    scheduledAt: { $lte: new Date() }
  })
  .sort({ priority: -1, scheduledAt: 1 })
  .limit(limit);
};

// Static method to get notification stats
notificationSchema.statics.getStats = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to cleanup old notifications
notificationSchema.statics.cleanup = function(olderThanDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['sent', 'delivered', 'cancelled'] }
  });
};

// Static method to find notifications by recipient
notificationSchema.statics.findByRecipient = function(recipientId, options = {}) {
  const {
    type,
    status,
    limit = 50,
    skip = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const query = { recipientId };
  
  if (type) query.type = type;
  if (status) query.status = status;
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('recipient', 'profile.firstName profile.lastName email')
    .populate('job', 'title company.name')
    .populate('resume', 'originalName');
};

// Static method to bulk update status
notificationSchema.statics.bulkUpdateStatus = function(ids, status, updateData = {}) {
  const update = { status, ...updateData };
  
  if (status === 'sent') {
    update.sentAt = new Date();
  } else if (status === 'delivered') {
    update.deliveredAt = new Date();
  }
  
  return this.updateMany(
    { _id: { $in: ids } },
    { $set: update }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
