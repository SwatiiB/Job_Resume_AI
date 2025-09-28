const cron = require('node-cron');
const User = require('../src/models/User');
const Job = require('../src/models/Job');
const Resume = require('../src/models/Resume');
const Notification = require('../src/models/Notification');
const logger = require('../src/utils/logger');
const { notificationQueue } = require('../notifications/NotificationQueue');
const { findJobMatches } = require('../ai-services');

/**
 * Cron Jobs for Background Tasks
 * Handles scheduled tasks like weekly reminders, job matching, and cleanup
 */
class CronJobManager {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize and start all cron jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('Cron jobs are already running');
      return;
    }

    try {
      // Weekly resume refresh reminders (Mondays at 9 AM)
      this.scheduleWeeklyReminders();
      
      // Daily job matching notifications (Every day at 10 AM)
      this.scheduleDailyJobMatching();
      
      // Cleanup old notifications (Daily at 2 AM)
      this.scheduleNotificationCleanup();
      
      // Process failed notifications (Every 30 minutes)
      this.scheduleFailedNotificationRetry();
      
      // Update job statuses (Daily at midnight)
      this.scheduleJobStatusUpdates();
      
      // Generate daily analytics (Daily at 1 AM)
      this.scheduleDailyAnalytics();

      this.isRunning = true;
      logger.info('All cron jobs started successfully');

    } catch (error) {
      logger.error('Failed to start cron jobs:', error);
    }
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    try {
      this.jobs.forEach((job, name) => {
        job.stop();
        logger.info(`Stopped cron job: ${name}`);
      });
      
      this.jobs.clear();
      this.isRunning = false;
      
      logger.info('All cron jobs stopped');

    } catch (error) {
      logger.error('Error stopping cron jobs:', error);
    }
  }

  /**
   * Schedule weekly resume refresh reminders
   */
  scheduleWeeklyReminders() {
    const cronPattern = process.env.WEEKLY_REMINDER_CRON || '0 9 * * 1'; // Mondays at 9 AM
    
    const job = cron.schedule(cronPattern, async () => {
      await this.processWeeklyReminders();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    this.jobs.set('weeklyReminders', job);
    job.start();
    
    logger.info(`Scheduled weekly reminders: ${cronPattern}`);
  }

  /**
   * Schedule daily job matching notifications
   */
  scheduleDailyJobMatching() {
    const cronPattern = '0 10 * * *'; // Daily at 10 AM
    
    const job = cron.schedule(cronPattern, async () => {
      await this.processDailyJobMatching();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    this.jobs.set('dailyJobMatching', job);
    job.start();
    
    logger.info(`Scheduled daily job matching: ${cronPattern}`);
  }

  /**
   * Schedule notification cleanup
   */
  scheduleNotificationCleanup() {
    const cronPattern = '0 2 * * *'; // Daily at 2 AM
    
    const job = cron.schedule(cronPattern, async () => {
      await this.processNotificationCleanup();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    this.jobs.set('notificationCleanup', job);
    job.start();
    
    logger.info(`Scheduled notification cleanup: ${cronPattern}`);
  }

  /**
   * Schedule failed notification retry
   */
  scheduleFailedNotificationRetry() {
    const cronPattern = '*/30 * * * *'; // Every 30 minutes
    
    const job = cron.schedule(cronPattern, async () => {
      await this.processFailedNotificationRetry();
    }, {
      scheduled: false
    });

    this.jobs.set('failedNotificationRetry', job);
    job.start();
    
    logger.info(`Scheduled failed notification retry: ${cronPattern}`);
  }

  /**
   * Schedule job status updates
   */
  scheduleJobStatusUpdates() {
    const cronPattern = '0 0 * * *'; // Daily at midnight
    
    const job = cron.schedule(cronPattern, async () => {
      await this.processJobStatusUpdates();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    this.jobs.set('jobStatusUpdates', job);
    job.start();
    
    logger.info(`Scheduled job status updates: ${cronPattern}`);
  }

  /**
   * Schedule daily analytics
   */
  scheduleDailyAnalytics() {
    const cronPattern = '0 1 * * *'; // Daily at 1 AM
    
    const job = cron.schedule(cronPattern, async () => {
      await this.processDailyAnalytics();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    this.jobs.set('dailyAnalytics', job);
    job.start();
    
    logger.info(`Scheduled daily analytics: ${cronPattern}`);
  }

  /**
   * Process weekly resume refresh reminders
   */
  async processWeeklyReminders() {
    try {
      logger.info('Starting weekly resume refresh reminders...');

      const staleDays = parseInt(process.env.PROFILE_STALE_DAYS) || 30;
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - staleDays);

      // Find users with stale profiles
      const staleUsers = await User.find({
        role: 'candidate',
        isActive: true,
        isVerified: true,
        'profile.lastProfileUpdate': { $lt: staleDate }
      }).limit(1000); // Process in batches

      let processed = 0;
      const errors = [];

      for (const user of staleUsers) {
        try {
          // Check if reminder already sent recently
          const recentReminder = await Notification.findOne({
            recipientId: user._id,
            type: 'resume_refresh_reminder',
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
          });

          if (recentReminder) {
            continue; // Skip if reminder sent recently
          }

          // Get user's active resume
          const activeResume = await Resume.findOne({
            userId: user._id,
            isActive: true
          });

          const profileData = {
            lastProfileUpdate: user.profile.lastProfileUpdate,
            profileCompletion: user.profile.profileCompletion,
            resumeId: activeResume?._id,
            suggestions: this.getProfileSuggestions(user),
            matchingJobs: await this.getMatchingJobsCount(user)
          };

          // Queue reminder email
          await notificationQueue.queueWeeklyReminder(
            user._id,
            user.email,
            user.profile.fullName || user.email,
            profileData
          );

          processed++;

        } catch (error) {
          logger.error(`Failed to process weekly reminder for user ${user._id}:`, error);
          errors.push({ userId: user._id, error: error.message });
        }
      }

      logger.info(`Weekly reminders processed: ${processed} sent, ${errors.length} errors`);

    } catch (error) {
      logger.error('Weekly reminders processing failed:', error);
    }
  }

  /**
   * Process daily job matching notifications
   */
  async processDailyJobMatching() {
    try {
      logger.info('Starting daily job matching notifications...');

      // Find jobs posted in the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const newJobs = await Job.find({
        status: 'active',
        createdAt: { $gte: yesterday }
      }).populate('postedBy', 'profile');

      if (newJobs.length === 0) {
        logger.info('No new jobs found for matching');
        return;
      }

      // Find active candidates
      const candidates = await User.find({
        role: 'candidate',
        isActive: true,
        isVerified: true
      }).limit(5000);

      let totalNotifications = 0;
      const threshold = parseInt(process.env.JOB_MATCH_THRESHOLD) || 50;

      for (const job of newJobs) {
        try {
          const candidatesWithResumes = [];
          
          // Get candidates with active resumes
          for (const candidate of candidates) {
            const activeResume = await Resume.findOne({
              userId: candidate._id,
              isActive: true,
              embedding: { $exists: true }
            });
            
            if (activeResume) {
              candidatesWithResumes.push({ candidate, resume: activeResume });
            }
          }

          // Find matches for this job
          const resumes = candidatesWithResumes.map(item => item.resume);
          const matches = await findJobMatches(job, resumes, 50);

          // Send notifications to matched candidates
          for (const match of matches.matches) {
            if (match.overallScore >= threshold) {
              const candidate = candidatesWithResumes.find(
                item => item.resume._id.toString() === match.resume.id.toString()
              )?.candidate;

              if (candidate) {
                await notificationQueue.queueJobMatchNotification(
                  candidate._id,
                  candidate.email,
                  candidate.profile.fullName || candidate.email,
                  {
                    id: job._id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    salary: job.salary,
                    employmentType: job.employmentType,
                    requirements: job.requirements,
                    skills: job.skills,
                    createdAt: job.createdAt
                  },
                  match.overallScore
                );

                totalNotifications++;
              }
            }
          }

        } catch (error) {
          logger.error(`Failed to process job matching for job ${job._id}:`, error);
        }
      }

      logger.info(`Daily job matching completed: ${totalNotifications} notifications queued for ${newJobs.length} new jobs`);

    } catch (error) {
      logger.error('Daily job matching failed:', error);
    }
  }

  /**
   * Process notification cleanup
   */
  async processNotificationCleanup() {
    try {
      logger.info('Starting notification cleanup...');

      // Clean old notifications (older than 90 days)
      const cleanupResult = await Notification.cleanup(90);
      
      // Clean old queue jobs
      await notificationQueue.cleanJobs(24 * 60 * 60 * 1000); // 24 hours
      
      logger.info(`Notification cleanup completed: ${cleanupResult.deletedCount} notifications removed`);

    } catch (error) {
      logger.error('Notification cleanup failed:', error);
    }
  }

  /**
   * Process failed notification retry
   */
  async processFailedNotificationRetry() {
    try {
      await notificationQueue.processRetryNotifications();
    } catch (error) {
      logger.error('Failed notification retry processing failed:', error);
    }
  }

  /**
   * Process job status updates
   */
  async processJobStatusUpdates() {
    try {
      logger.info('Starting job status updates...');

      const now = new Date();
      
      // Auto-expire jobs past deadline
      const expiredJobs = await Job.updateMany(
        {
          status: 'active',
          applicationDeadline: { $lt: now }
        },
        {
          status: 'expired'
        }
      );

      // Auto-close jobs that reached max applications
      const jobsToClose = await Job.find({
        status: 'active',
        'autoClose.enabled': true,
        'autoClose.maxApplications': { $exists: true }
      });

      let closedJobs = 0;
      for (const job of jobsToClose) {
        if (job.applicationCount >= job.autoClose.maxApplications) {
          job.status = 'closed';
          await job.save();
          closedJobs++;
        }
      }

      logger.info(`Job status updates completed: ${expiredJobs.modifiedCount} expired, ${closedJobs} auto-closed`);

    } catch (error) {
      logger.error('Job status updates failed:', error);
    }
  }

  /**
   * Process daily analytics
   */
  async processDailyAnalytics() {
    try {
      logger.info('Starting daily analytics processing...');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate daily metrics
      const metrics = {
        date: yesterday.toISOString().split('T')[0],
        users: {
          newRegistrations: await User.countDocuments({
            createdAt: { $gte: yesterday, $lt: today }
          }),
          activeUsers: await User.countDocuments({
            isActive: true,
            lastLogin: { $gte: yesterday }
          })
        },
        jobs: {
          newJobs: await Job.countDocuments({
            createdAt: { $gte: yesterday, $lt: today }
          }),
          totalApplications: await Job.aggregate([
            { $match: { 'applications.appliedAt': { $gte: yesterday, $lt: today } } },
            { $unwind: '$applications' },
            { $match: { 'applications.appliedAt': { $gte: yesterday, $lt: today } } },
            { $count: 'total' }
          ])
        },
        resumes: {
          newUploads: await Resume.countDocuments({
            createdAt: { $gte: yesterday, $lt: today }
          }),
          parsed: await Resume.countDocuments({
            'parsedContent.parsedAt': { $gte: yesterday, $lt: today }
          })
        },
        notifications: await Notification.getStats({
          createdAt: { $gte: yesterday, $lt: today }
        })
      };

      // Store metrics (you could save to a separate Analytics collection)
      logger.info('Daily analytics:', metrics);

    } catch (error) {
      logger.error('Daily analytics processing failed:', error);
    }
  }

  /**
   * Get profile suggestions for user
   */
  getProfileSuggestions(user) {
    const suggestions = [];

    if (!user.profile.firstName) suggestions.push('Add your first name');
    if (!user.profile.lastName) suggestions.push('Add your last name');
    if (!user.profile.phone) suggestions.push('Add your phone number');
    if (!user.profile.skills || user.profile.skills.length < 5) suggestions.push('Add more skills');
    if (!user.profile.experience || user.profile.experience.length === 0) suggestions.push('Add work experience');

    return suggestions.slice(0, 5); // Top 5 suggestions
  }

  /**
   * Get count of matching jobs for user
   */
  async getMatchingJobsCount(user) {
    try {
      // This is a simplified version - in production, you'd use the full AI matching
      const userSkills = user.profile.skills || [];
      
      if (userSkills.length === 0) return 0;

      const matchingJobs = await Job.countDocuments({
        status: 'active',
        skills: { $in: userSkills.map(skill => new RegExp(skill, 'i')) }
      });

      return Math.min(matchingJobs, 99); // Cap at 99 for display

    } catch (error) {
      logger.error('Error getting matching jobs count:', error);
      return 0;
    }
  }

  /**
   * Manual trigger for weekly reminders (for testing)
   */
  async triggerWeeklyReminders() {
    logger.info('Manually triggering weekly reminders...');
    await this.processWeeklyReminders();
  }

  /**
   * Manual trigger for job matching (for testing)
   */
  async triggerJobMatching() {
    logger.info('Manually triggering job matching...');
    await this.processDailyJobMatching();
  }

  /**
   * Get cron job status
   */
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: {},
      nextRuns: {}
    };

    this.jobs.forEach((job, name) => {
      status.jobs[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
      
      if (job.nextDate) {
        status.nextRuns[name] = job.nextDate();
      }
    });

    return status;
  }

  /**
   * Restart specific cron job
   */
  restartJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      job.start();
      logger.info(`Restarted cron job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Add custom cron job
   */
  addCustomJob(name, cronPattern, taskFunction, options = {}) {
    try {
      const job = cron.schedule(cronPattern, taskFunction, {
        scheduled: false,
        ...options
      });

      this.jobs.set(name, job);
      job.start();

      logger.info(`Added custom cron job: ${name} (${cronPattern})`);
      return true;

    } catch (error) {
      logger.error(`Failed to add custom cron job ${name}:`, error);
      return false;
    }
  }

  /**
   * Remove custom cron job
   */
  removeCustomJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      logger.info(`Removed custom cron job: ${name}`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
const cronJobManager = new CronJobManager();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, stopping cron jobs...');
  cronJobManager.stop();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, stopping cron jobs...');
  cronJobManager.stop();
});

module.exports = {
  cronJobManager,
  CronJobManager
};
