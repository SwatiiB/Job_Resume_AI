const express = require('express');
const { body, query } = require('express-validator');
const {
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
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationPreferences:
 *       type: object
 *       properties:
 *         job_match:
 *           type: boolean
 *           description: Receive job match notifications
 *         resume_refresh_reminder:
 *           type: boolean
 *           description: Receive weekly resume refresh reminders
 *         application_status:
 *           type: boolean
 *           description: Receive application status updates
 *         interview_scheduled:
 *           type: boolean
 *           description: Receive interview notifications
 *         profile_completion:
 *           type: boolean
 *           description: Receive profile completion reminders
 *         job_alert:
 *           type: boolean
 *           description: Receive general job alerts
 */

// Validation rules
const preferencesValidation = [
  body('job_match').optional().isBoolean().withMessage('job_match must be boolean'),
  body('resume_refresh_reminder').optional().isBoolean().withMessage('resume_refresh_reminder must be boolean'),
  body('application_status').optional().isBoolean().withMessage('application_status must be boolean'),
  body('interview_scheduled').optional().isBoolean().withMessage('interview_scheduled must be boolean'),
  body('profile_completion').optional().isBoolean().withMessage('profile_completion must be boolean'),
  body('job_alert').optional().isBoolean().withMessage('job_alert must be boolean')
];

const testNotificationValidation = [
  body('type')
    .isIn(['otp_verification', 'welcome', 'resume_refresh_reminder', 'job_match', 'application_status'])
    .withMessage('Invalid notification type'),
  body('recipientEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid recipient email is required'),
  body('templateData')
    .optional()
    .isObject()
    .withMessage('Template data must be an object')
];

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [otp_verification, job_match, resume_refresh_reminder, welcome, password_reset, application_status]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, delivered, failed, bounced]
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/', protect, getNotifications);

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreferences'
 */
router.get('/preferences', protect, getNotificationPreferences);

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationPreferences'
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 */
router.put('/preferences', protect, preferencesValidation, validate, updateNotificationPreferences);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:notificationId/read', protect, markAsRead);

/**
 * @swagger
 * /api/notifications/amp/profile-update:
 *   post:
 *     summary: Handle AMP form submission for profile updates
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *               currentPosition:
 *                 type: string
 *               newSkills:
 *                 type: string
 *               jobTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               salaryRange:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid token or data
 */
router.post('/amp/profile-update', handleAMPProfileUpdate);

/**
 * @swagger
 * /api/notifications/unsubscribe/{token}:
 *   get:
 *     summary: Handle unsubscribe request
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 *       404:
 *         description: Invalid unsubscribe token
 */
router.get('/unsubscribe/:token', handleUnsubscribe);

// Admin routes
/**
 * @swagger
 * /api/notifications/admin/all:
 *   get:
 *     summary: Get all notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: All notifications retrieved successfully
 */
router.get('/admin/all', protect, authorize('admin'), getAllNotifications);

/**
 * @swagger
 * /api/notifications/admin/stats:
 *   get:
 *     summary: Get notification statistics (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics retrieved successfully
 */
router.get('/admin/stats', protect, authorize('admin'), getNotificationStats);

/**
 * @swagger
 * /api/notifications/admin/test:
 *   post:
 *     summary: Send test notification (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - recipientEmail
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [otp_verification, welcome, resume_refresh_reminder, job_match, application_status]
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *               templateData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Test notification sent successfully
 */
router.post('/admin/test', protect, authorize('admin'), testNotificationValidation, validate, sendTestNotification);

/**
 * @swagger
 * /api/notifications/admin/queue/status:
 *   get:
 *     summary: Get notification queue status (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue status retrieved successfully
 */
router.get('/admin/queue/status', protect, authorize('admin'), getQueueStatus);

/**
 * @swagger
 * /api/notifications/admin/retry-all:
 *   post:
 *     summary: Retry all failed notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Failed notifications retry initiated
 */
router.post('/admin/retry-all', protect, authorize('admin'), retryAllFailed);

/**
 * @swagger
 * /api/notifications/admin/{notificationId}/retry:
 *   post:
 *     summary: Retry specific notification (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification retry queued successfully
 */
router.post('/admin/:notificationId/retry', protect, authorize('admin'), retryNotification);

/**
 * @swagger
 * /api/notifications/admin/queue/pause:
 *   post:
 *     summary: Pause notification queue (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification queue paused
 */
router.post('/admin/queue/pause', protect, authorize('admin'), pauseQueue);

/**
 * @swagger
 * /api/notifications/admin/queue/resume:
 *   post:
 *     summary: Resume notification queue (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification queue resumed
 */
router.post('/admin/queue/resume', protect, authorize('admin'), resumeQueue);

/**
 * @swagger
 * /api/notifications/admin/cron/status:
 *   get:
 *     summary: Get cron job status (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cron job status retrieved successfully
 */
router.get('/admin/cron/status', protect, authorize('admin'), getCronStatus);

/**
 * @swagger
 * /api/notifications/admin/cron/{jobName}/trigger:
 *   post:
 *     summary: Trigger manual cron job (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [weeklyReminders, jobMatching]
 *     responses:
 *       200:
 *         description: Cron job triggered successfully
 */
router.post('/admin/cron/:jobName/trigger', protect, authorize('admin'), triggerCronJob);

module.exports = router;
