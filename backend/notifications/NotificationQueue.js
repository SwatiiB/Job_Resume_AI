const { Queue, Worker, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('../src/utils/logger');
const { notificationService } = require('./NotificationService');
const Notification = require('../src/models/Notification');

/**
 * Notification Queue Management with BullMQ
 * Handles background processing of notifications with retry logic
 */
class NotificationQueue {
  constructor() {
    this.queueName = process.env.NOTIFICATION_QUEUE_NAME || 'notifications';
    this.retryAttempts = parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.NOTIFICATION_RETRY_DELAY) || 5000;
    
    // Redis configuration
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null
    };

    // Initialize Redis connection
    this.redis = new IORedis(this.redisConfig);
    
    // Initialize queue
    this.queue = new Queue(this.queueName, {
      connection: this.redis,
      defaultJobOptions: {
        attempts: this.retryAttempts,
        backoff: {
          type: 'exponential',
          delay: this.retryDelay
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50 // Keep last 50 failed jobs
      }
    });

    // Initialize worker
    this.worker = new Worker(this.queueName, this.processJob.bind(this), {
      connection: this.redis,
      concurrency: parseInt(process.env.NOTIFICATION_CONCURRENCY) || 5,
      limiter: {
        max: 100, // Max 100 jobs per minute
        duration: 60 * 1000
      }
    });

    // Initialize queue events
    this.queueEvents = new QueueEvents(this.queueName, {
      connection: this.redis
    });

    this.setupEventListeners();
    
    logger.info(`NotificationQueue initialized: ${this.queueName}`);
  }

  /**
   * Setup event listeners for monitoring
   */
  setupEventListeners() {
    // Worker events
    this.worker.on('completed', (job) => {
      logger.info(`Notification job completed: ${job.id} (${job.data.type})`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Notification job failed: ${job.id} (${job.data.type})`, err);
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn(`Notification job stalled: ${jobId}`);
    });

    // Queue events
    this.queueEvents.on('waiting', ({ jobId }) => {
      logger.debug(`Notification job waiting: ${jobId}`);
    });

    this.queueEvents.on('active', ({ jobId }) => {
      logger.debug(`Notification job active: ${jobId}`);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      logger.debug(`Notification job progress: ${jobId}`, data);
    });

    // Redis connection events
    this.redis.on('connect', () => {
      logger.info('Redis connected for notifications');
    });

    this.redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    this.redis.on('ready', () => {
      logger.info('Redis ready for notifications');
    });
  }

  /**
   * Process notification job
   */
  async processJob(job) {
    const { type, data } = job.data;
    const startTime = Date.now();

    try {
      logger.info(`Processing notification job: ${job.id} (${type})`);

      let result;

      switch (type) {
        case 'sendEmail':
          result = await this.processSendEmail(data);
          break;
        case 'weeklyReminder':
          result = await this.processWeeklyReminder(data);
          break;
        case 'jobMatchNotification':
          result = await this.processJobMatchNotification(data);
          break;
        case 'otpVerification':
          result = await this.processOTPVerification(data);
          break;
        case 'welcomeEmail':
          result = await this.processWelcomeEmail(data);
          break;
        case 'applicationStatusUpdate':
          result = await this.processApplicationStatusUpdate(data);
          break;
        case 'bulkNotification':
          result = await this.processBulkNotification(data);
          break;
        default:
          throw new Error(`Unknown notification job type: ${type}`);
      }

      const processingTime = Date.now() - startTime;
      logger.info(`Notification job completed: ${job.id} (${processingTime}ms)`);

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error(`Notification job failed: ${job.id} (${processingTime}ms)`, error);
      throw error;
    }
  }

  /**
   * Process send email job
   */
  async processSendEmail(data) {
    return await notificationService.sendNotification(data);
  }

  /**
   * Process weekly reminder job
   */
  async processWeeklyReminder(data) {
    const { recipientId, email, name, profileData } = data;
    return await notificationService.sendResumeRefreshReminder(
      recipientId, email, name, profileData
    );
  }

  /**
   * Process job match notification job
   */
  async processJobMatchNotification(data) {
    const { recipientId, email, name, jobData, matchScore } = data;
    return await notificationService.sendJobMatchNotification(
      recipientId, email, name, jobData, matchScore
    );
  }

  /**
   * Process OTP verification job
   */
  async processOTPVerification(data) {
    const { recipientId, email, name, otp } = data;
    return await notificationService.sendOTPVerification(
      recipientId, email, name, otp
    );
  }

  /**
   * Process welcome email job
   */
  async processWelcomeEmail(data) {
    const { recipientId, email, name, role } = data;
    return await notificationService.sendWelcomeEmail(
      recipientId, email, name, role
    );
  }

  /**
   * Process application status update job
   */
  async processApplicationStatusUpdate(data) {
    const { recipientId, email, name, applicationData } = data;
    return await notificationService.sendApplicationStatusUpdate(
      recipientId, email, name, applicationData
    );
  }

  /**
   * Process bulk notification job
   */
  async processBulkNotification(data) {
    const { notifications } = data;
    return await notificationService.bulkSend(notifications);
  }

  /**
   * Add notification job to queue
   */
  async addJob(type, data, options = {}) {
    try {
      const jobOptions = {
        priority: this.getPriority(data.priority),
        delay: options.delay || 0,
        ...options
      };

      const job = await this.queue.add(type, { type, data }, jobOptions);
      
      logger.info(`Notification job queued: ${job.id} (${type})`);
      return job;

    } catch (error) {
      logger.error(`Failed to queue notification job (${type}):`, error);
      throw error;
    }
  }

  /**
   * Add email notification to queue
   */
  async queueEmail(notificationData, options = {}) {
    return await this.addJob('sendEmail', notificationData, options);
  }

  /**
   * Add OTP verification to queue
   */
  async queueOTPVerification(recipientId, email, name, otp, options = {}) {
    return await this.addJob('otpVerification', {
      recipientId, email, name, otp
    }, { priority: 10, ...options }); // High priority
  }

  /**
   * Add job match notification to queue
   */
  async queueJobMatchNotification(recipientId, email, name, jobData, matchScore, options = {}) {
    return await this.addJob('jobMatchNotification', {
      recipientId, email, name, jobData, matchScore
    }, options);
  }

  /**
   * Add weekly reminder to queue
   */
  async queueWeeklyReminder(recipientId, email, name, profileData, options = {}) {
    return await this.addJob('weeklyReminder', {
      recipientId, email, name, profileData
    }, options);
  }

  /**
   * Add welcome email to queue
   */
  async queueWelcomeEmail(recipientId, email, name, role, options = {}) {
    return await this.addJob('welcomeEmail', {
      recipientId, email, name, role
    }, { priority: 8, ...options }); // High priority
  }

  /**
   * Add application status update to queue
   */
  async queueApplicationStatusUpdate(recipientId, email, name, applicationData, options = {}) {
    return await this.addJob('applicationStatusUpdate', {
      recipientId, email, name, applicationData
    }, { priority: 7, ...options });
  }

  /**
   * Add bulk notification to queue
   */
  async queueBulkNotification(notifications, options = {}) {
    return await this.addJob('bulkNotification', {
      notifications
    }, { priority: 3, ...options }); // Lower priority for bulk
  }

  /**
   * Schedule recurring job (for cron jobs)
   */
  async scheduleRecurringJob(name, type, data, cronPattern, options = {}) {
    try {
      const job = await this.queue.add(type, { type, data }, {
        repeat: { pattern: cronPattern },
        jobId: name, // Unique ID to prevent duplicates
        ...options
      });

      logger.info(`Recurring job scheduled: ${name} (${cronPattern})`);
      return job;

    } catch (error) {
      logger.error(`Failed to schedule recurring job (${name}):`, error);
      throw error;
    }
  }

  /**
   * Get priority value for BullMQ
   */
  getPriority(priority) {
    const priorities = {
      urgent: 10,
      high: 8,
      normal: 5,
      low: 2
    };
    
    return priorities[priority] || priorities.normal;
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    try {
      const waiting = await this.queue.getWaiting();
      const active = await this.queue.getActive();
      const completed = await this.queue.getCompleted();
      const failed = await this.queue.getFailed();
      const delayed = await this.queue.getDelayed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length
      };

    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      return null;
    }
  }

  /**
   * Get failed jobs for retry
   */
  async getFailedJobs(start = 0, end = 10) {
    try {
      return await this.queue.getFailed(start, end);
    } catch (error) {
      logger.error('Failed to get failed jobs:', error);
      return [];
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId) {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.retry();
        logger.info(`Job retried: ${jobId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to retry job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Retry all failed jobs
   */
  async retryAllFailedJobs() {
    try {
      const failedJobs = await this.queue.getFailed();
      let retried = 0;

      for (const job of failedJobs) {
        try {
          await job.retry();
          retried++;
        } catch (error) {
          logger.error(`Failed to retry job ${job.id}:`, error);
        }
      }

      logger.info(`Retried ${retried} of ${failedJobs.length} failed jobs`);
      return { total: failedJobs.length, retried };

    } catch (error) {
      logger.error('Failed to retry all failed jobs:', error);
      throw error;
    }
  }

  /**
   * Clean old jobs
   */
  async cleanJobs(grace = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      await this.queue.clean(grace, 100, 'completed');
      await this.queue.clean(grace, 50, 'failed');
      
      logger.info('Queue cleaned successfully');
    } catch (error) {
      logger.error('Failed to clean queue:', error);
      throw error;
    }
  }

  /**
   * Pause queue processing
   */
  async pauseQueue() {
    try {
      await this.queue.pause();
      logger.info('Queue paused');
    } catch (error) {
      logger.error('Failed to pause queue:', error);
      throw error;
    }
  }

  /**
   * Resume queue processing
   */
  async resumeQueue() {
    try {
      await this.queue.resume();
      logger.info('Queue resumed');
    } catch (error) {
      logger.error('Failed to resume queue:', error);
      throw error;
    }
  }

  /**
   * Get queue health status
   */
  async getHealth() {
    try {
      const stats = await this.getStats();
      const isActive = !await this.queue.isPaused();
      
      return {
        status: 'healthy',
        active: isActive,
        stats,
        worker: {
          running: !this.worker.closing,
          concurrency: this.worker.opts.concurrency
        },
        redis: {
          status: this.redis.status,
          host: this.redisConfig.host,
          port: this.redisConfig.port
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      logger.info('Shutting down notification queue...');
      
      await this.worker.close();
      await this.queue.close();
      await this.queueEvents.close();
      await this.redis.disconnect();
      
      logger.info('Notification queue shutdown complete');
    } catch (error) {
      logger.error('Error during queue shutdown:', error);
    }
  }

  /**
   * Process pending notifications from database
   */
  async processPendingNotifications() {
    try {
      const pendingNotifications = await Notification.findPending(100);
      
      for (const notification of pendingNotifications) {
        try {
          await this.queueEmail(notification.toObject());
          await notification.updateOne({ status: 'queued' });
        } catch (error) {
          logger.error(`Failed to queue pending notification ${notification._id}:`, error);
          await notification.markAsFailed(error.message);
        }
      }

      if (pendingNotifications.length > 0) {
        logger.info(`Queued ${pendingNotifications.length} pending notifications`);
      }

    } catch (error) {
      logger.error('Failed to process pending notifications:', error);
    }
  }

  /**
   * Process retry notifications from database
   */
  async processRetryNotifications() {
    try {
      const retryNotifications = await Notification.findReadyForRetry();
      
      for (const notification of retryNotifications) {
        try {
          await this.queueEmail(notification.toObject());
          await notification.retry();
        } catch (error) {
          logger.error(`Failed to queue retry notification ${notification._id}:`, error);
        }
      }

      if (retryNotifications.length > 0) {
        logger.info(`Queued ${retryNotifications.length} retry notifications`);
      }

    } catch (error) {
      logger.error('Failed to process retry notifications:', error);
    }
  }
}

// Export singleton instance
const notificationQueue = new NotificationQueue();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down notification queue...');
  await notificationQueue.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down notification queue...');
  await notificationQueue.shutdown();
  process.exit(0);
});

module.exports = {
  notificationQueue,
  NotificationQueue
};
