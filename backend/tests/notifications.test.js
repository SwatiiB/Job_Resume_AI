const { NotificationService, NotificationQueue } = require('../notifications');
const Notification = require('../src/models/Notification');

// Mock dependencies
jest.mock('sib-api-v3-sdk');
jest.mock('bullmq');
jest.mock('ioredis');
jest.mock('../src/utils/logger');
jest.mock('../src/models/Notification');

describe('Notification System', () => {
  describe('NotificationService', () => {
    let notificationService;

    beforeEach(() => {
      // Mock environment variables
      process.env.BREVO_SMTP_API_KEY = 'test-api-key';
      process.env.BREVO_SENDER_EMAIL = 'test@example.com';
      process.env.BREVO_SENDER_NAME = 'Test Platform';

      notificationService = new NotificationService();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('sendOTPVerification', () => {
      it('should send OTP verification email successfully', async () => {
        const mockSendNotification = jest.fn().mockResolvedValue({
          success: true,
          notification: { _id: 'notification123' }
        });

        notificationService.sendNotification = mockSendNotification;

        const result = await notificationService.sendOTPVerification(
          'user123',
          'test@example.com',
          'John Doe',
          '123456'
        );

        expect(mockSendNotification).toHaveBeenCalledWith({
          recipientId: 'user123',
          type: 'otp_verification',
          channel: 'email',
          priority: 'high',
          subject: 'Verify Your Email Address',
          templateId: 'otp-verification',
          content: {
            templateData: {
              otp: '123456',
              expiryMinutes: 5,
              supportEmail: process.env.SUPPORT_EMAIL
            },
            personalization: {
              email: 'test@example.com',
              name: 'John Doe',
              firstName: 'John'
            }
          }
        });

        expect(result.success).toBe(true);
      });

      it('should handle OTP sending errors gracefully', async () => {
        const mockSendNotification = jest.fn().mockRejectedValue(new Error('Email service unavailable'));

        notificationService.sendNotification = mockSendNotification;

        await expect(
          notificationService.sendOTPVerification('user123', 'test@example.com', 'John Doe', '123456')
        ).rejects.toThrow('Email service unavailable');
      });
    });

    describe('sendJobMatchNotification', () => {
      it('should send job match notification with correct data', async () => {
        const mockSendNotification = jest.fn().mockResolvedValue({
          success: true,
          notification: { _id: 'notification123' }
        });

        notificationService.sendNotification = mockSendNotification;

        const jobData = {
          id: 'job123',
          title: 'Software Engineer',
          company: { name: 'Tech Corp' },
          location: { fullLocation: 'San Francisco, CA' },
          employmentType: 'full-time',
          createdAt: new Date()
        };

        const result = await notificationService.sendJobMatchNotification(
          'user123',
          'test@example.com',
          'John Doe',
          jobData,
          85
        );

        expect(mockSendNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            recipientId: 'user123',
            type: 'job_match',
            subject: 'New Job Match: Software Engineer (85% match)',
            templateId: 'job-match',
            content: expect.objectContaining({
              templateData: expect.objectContaining({
                jobTitle: 'Software Engineer',
                companyName: 'Tech Corp',
                matchScore: 85
              })
            })
          })
        );

        expect(result.success).toBe(true);
      });
    });

    describe('generateAMPToken', () => {
      it('should generate valid AMP token', () => {
        const recipientId = 'user123';
        const token = notificationService.generateAMPToken(recipientId);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });

      it('should generate different tokens for different users', () => {
        const token1 = notificationService.generateAMPToken('user123');
        const token2 = notificationService.generateAMPToken('user456');

        expect(token1).not.toBe(token2);
      });
    });

    describe('verifyAMPToken', () => {
      it('should verify valid AMP token', () => {
        const recipientId = 'user123';
        const token = notificationService.generateAMPToken(recipientId);

        const verification = notificationService.verifyAMPToken(token);

        expect(verification.valid).toBe(true);
        expect(verification.recipientId).toBe(recipientId);
        expect(verification.action).toBe('profile_update');
      });

      it('should reject invalid AMP token', () => {
        const verification = notificationService.verifyAMPToken('invalid-token');

        expect(verification.valid).toBe(false);
        expect(verification.error).toBeDefined();
      });

      it('should reject expired AMP token', () => {
        // Mock an old timestamp
        const payload = {
          recipientId: 'user123',
          timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
          action: 'profile_update'
        };

        const token = Buffer.from(JSON.stringify(payload)).toString('base64');
        const verification = notificationService.verifyAMPToken(token);

        expect(verification.valid).toBe(false);
        expect(verification.error).toBe('Token expired');
      });
    });

    describe('renderEmailTemplate', () => {
      it('should render template with data', async () => {
        const mockTemplate = {
          html: '<h1>Hello {{name}}!</h1><p>Your OTP is {{otp}}</p>'
        };

        notificationService.getTemplate = jest.fn().mockResolvedValue(mockTemplate);

        const result = await notificationService.renderEmailTemplate('otp-verification', {
          name: 'John Doe',
          otp: '123456'
        });

        expect(result.html).toBe('<h1>Hello John Doe!</h1><p>Your OTP is 123456</p>');
      });

      it('should handle missing template gracefully', async () => {
        notificationService.getTemplate = jest.fn().mockResolvedValue(null);

        await expect(
          notificationService.renderEmailTemplate('non-existent', {})
        ).rejects.toThrow('Template not found: non-existent');
      });
    });

    describe('healthCheck', () => {
      it('should return healthy status when service is working', async () => {
        // Mock successful API call
        notificationService.transactionalEmailsApi = {
          getTransacEmailsList: jest.fn().mockResolvedValue({ emails: [] })
        };

        const health = await notificationService.healthCheck();

        expect(health.status).toBe('healthy');
        expect(health.provider).toBe('brevo');
      });

      it('should return unhealthy status when service fails', async () => {
        // Mock failed API call
        notificationService.transactionalEmailsApi = {
          getTransacEmailsList: jest.fn().mockRejectedValue(new Error('API Error'))
        };

        const health = await notificationService.healthCheck();

        expect(health.status).toBe('unhealthy');
        expect(health.error).toBe('API Error');
      });

      it('should return disabled status when not configured', async () => {
        const unconfiguredService = new NotificationService();
        unconfiguredService.enabled = false;

        const health = await unconfiguredService.healthCheck();

        expect(health.status).toBe('disabled');
      });
    });
  });

  describe('NotificationQueue', () => {
    let notificationQueue;

    beforeEach(() => {
      // Mock Redis and BullMQ
      const mockRedis = {
        status: 'ready',
        on: jest.fn(),
        disconnect: jest.fn()
      };

      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'job123' }),
        close: jest.fn(),
        isPaused: jest.fn().mockResolvedValue(false),
        getWaiting: jest.fn().mockResolvedValue([]),
        getActive: jest.fn().mockResolvedValue([]),
        getCompleted: jest.fn().mockResolvedValue([]),
        getFailed: jest.fn().mockResolvedValue([]),
        getDelayed: jest.fn().mockResolvedValue([])
      };

      const mockWorker = {
        on: jest.fn(),
        close: jest.fn(),
        closing: false,
        opts: { concurrency: 5 }
      };

      const mockQueueEvents = {
        on: jest.fn(),
        close: jest.fn()
      };

      notificationQueue = new NotificationQueue();
      notificationQueue.redis = mockRedis;
      notificationQueue.queue = mockQueue;
      notificationQueue.worker = mockWorker;
      notificationQueue.queueEvents = mockQueueEvents;
    });

    describe('addJob', () => {
      it('should add job to queue successfully', async () => {
        const jobData = {
          recipientId: 'user123',
          type: 'otp_verification',
          priority: 'high'
        };

        const result = await notificationQueue.addJob('sendEmail', jobData);

        expect(notificationQueue.queue.add).toHaveBeenCalledWith(
          'sendEmail',
          { type: 'sendEmail', data: jobData },
          expect.objectContaining({
            priority: expect.any(Number)
          })
        );

        expect(result.id).toBe('job123');
      });

      it('should handle queue errors gracefully', async () => {
        notificationQueue.queue.add.mockRejectedValue(new Error('Queue error'));

        await expect(
          notificationQueue.addJob('sendEmail', {})
        ).rejects.toThrow('Queue error');
      });
    });

    describe('queueOTPVerification', () => {
      it('should queue OTP verification with high priority', async () => {
        await notificationQueue.queueOTPVerification(
          'user123',
          'test@example.com',
          'John Doe',
          '123456'
        );

        expect(notificationQueue.queue.add).toHaveBeenCalledWith(
          'otpVerification',
          {
            type: 'otpVerification',
            data: {
              recipientId: 'user123',
              email: 'test@example.com',
              name: 'John Doe',
              otp: '123456'
            }
          },
          expect.objectContaining({
            priority: 10 // High priority
          })
        );
      });
    });

    describe('getStats', () => {
      it('should return queue statistics', async () => {
        const stats = await notificationQueue.getStats();

        expect(stats).toEqual({
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          total: 0
        });
      });
    });

    describe('getHealth', () => {
      it('should return healthy status', async () => {
        const health = await notificationQueue.getHealth();

        expect(health.status).toBe('healthy');
        expect(health.active).toBe(true);
        expect(health.stats).toBeDefined();
        expect(health.worker).toBeDefined();
        expect(health.redis).toBeDefined();
      });
    });
  });

  describe('Notification Model', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('markAsSent', () => {
      it('should update notification status to sent', async () => {
        const mockNotification = {
          status: 'pending',
          sentAt: null,
          externalId: null,
          save: jest.fn().mockResolvedValue(true)
        };

        const notification = Object.assign(mockNotification, Notification.prototype);
        
        await notification.markAsSent('external123', { messageId: 'msg123' });

        expect(notification.status).toBe('sent');
        expect(notification.sentAt).toBeInstanceOf(Date);
        expect(notification.externalId).toBe('external123');
        expect(notification.save).toHaveBeenCalled();
      });
    });

    describe('markAsFailed', () => {
      it('should update notification status to failed and increment retry count', async () => {
        const mockNotification = {
          status: 'pending',
          retryCount: 0,
          errorMessage: null,
          save: jest.fn().mockResolvedValue(true)
        };

        const notification = Object.assign(mockNotification, Notification.prototype);
        
        await notification.markAsFailed('Network error', 'NETWORK_ERROR');

        expect(notification.status).toBe('failed');
        expect(notification.errorMessage).toBe('Network error');
        expect(notification.errorCode).toBe('NETWORK_ERROR');
        expect(notification.retryCount).toBe(1);
        expect(notification.save).toHaveBeenCalled();
      });
    });

    describe('canRetry virtual', () => {
      it('should return true for failed notification within retry limit', () => {
        const notification = {
          status: 'failed',
          retryCount: 2,
          maxRetries: 3
        };

        const canRetry = notification.retryCount < notification.maxRetries && notification.status === 'failed';

        expect(canRetry).toBe(true);
      });

      it('should return false for notification that exceeded retry limit', () => {
        const notification = {
          status: 'failed',
          retryCount: 3,
          maxRetries: 3
        };

        const canRetry = notification.retryCount < notification.maxRetries && notification.status === 'failed';

        expect(canRetry).toBe(false);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should process complete notification flow', async () => {
      const notificationService = new NotificationService();
      const notificationQueue = new NotificationQueue();

      // Mock successful email sending
      notificationService.sendNotification = jest.fn().mockResolvedValue({
        success: true,
        notification: { _id: 'notification123' },
        result: { messageId: 'msg123' }
      });

      // Mock queue processing
      notificationQueue.processJob = jest.fn().mockResolvedValue({
        success: true
      });

      // Test OTP flow
      const otpResult = await notificationService.sendOTPVerification(
        'user123',
        'test@example.com',
        'John Doe',
        '123456'
      );

      expect(otpResult.success).toBe(true);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it('should handle end-to-end job match notification flow', async () => {
      const notificationService = new NotificationService();
      
      notificationService.sendNotification = jest.fn().mockResolvedValue({
        success: true,
        notification: { _id: 'notification123' }
      });

      const jobData = {
        id: 'job123',
        title: 'Software Engineer',
        company: { name: 'Tech Corp' },
        location: { fullLocation: 'San Francisco, CA' },
        employmentType: 'full-time',
        createdAt: new Date()
      };

      const result = await notificationService.sendJobMatchNotification(
        'user123',
        'test@example.com',
        'John Doe',
        jobData,
        85
      );

      expect(result.success).toBe(true);
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'job_match',
          content: expect.objectContaining({
            templateData: expect.objectContaining({
              matchScore: 85,
              jobTitle: 'Software Engineer'
            })
          })
        })
      );
    });
  });

  describe('Template System', () => {
    it('should load templates correctly', async () => {
      const notificationService = new NotificationService();
      
      // Mock file system
      const fs = require('fs').promises;
      fs.readdir = jest.fn().mockResolvedValue(['otp-verification.hbs', 'job-match.hbs']);
      fs.stat = jest.fn().mockResolvedValue({ isFile: () => true });
      fs.readFile = jest.fn().mockResolvedValue('<h1>Test Template</h1>');

      await notificationService.loadTemplates();

      expect(fs.readdir).toHaveBeenCalled();
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should render templates with Handlebars', async () => {
      const notificationService = new NotificationService();
      
      const mockTemplate = {
        html: '<h1>Hello {{name}}!</h1><p>Your score is {{score}}%</p>'
      };

      notificationService.getTemplate = jest.fn().mockResolvedValue(mockTemplate);

      const result = await notificationService.renderEmailTemplate('test', {
        name: 'John',
        score: 85
      });

      expect(result.html).toBe('<h1>Hello John!</h1><p>Your score is 85%</p>');
    });
  });

  describe('Error Handling', () => {
    it('should handle Brevo API errors gracefully', async () => {
      const notificationService = new NotificationService();
      
      notificationService.transactionalEmailsApi = {
        sendTransacEmail: jest.fn().mockRejectedValue(new Error('API_RATE_LIMIT'))
      };

      const notification = {
        _id: 'notification123',
        templateId: 'test',
        subject: 'Test',
        content: { personalization: { email: 'test@example.com' } }
      };

      await expect(notificationService.sendEmail(notification)).rejects.toThrow('Email sending failed');
    });

    it('should handle template rendering errors', async () => {
      const notificationService = new NotificationService();
      
      notificationService.getTemplate = jest.fn().mockRejectedValue(new Error('Template error'));

      await expect(
        notificationService.renderEmailTemplate('broken-template', {})
      ).rejects.toThrow('Template error');
    });

    it('should handle queue processing errors', async () => {
      const notificationQueue = new NotificationQueue();
      
      const invalidJob = {
        data: {
          type: 'unknown_type',
          data: {}
        }
      };

      await expect(notificationQueue.processJob(invalidJob)).rejects.toThrow('Unknown notification job type');
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk notifications efficiently', async () => {
      const notificationService = new NotificationService();
      
      notificationService.sendNotification = jest.fn().mockResolvedValue({
        success: true,
        notification: { _id: 'notification123' }
      });

      const notifications = Array(10).fill().map((_, i) => ({
        recipientId: `user${i}`,
        type: 'test',
        channel: 'email',
        subject: `Test ${i}`,
        templateId: 'test',
        content: { personalization: { email: `test${i}@example.com` } }
      }));

      const startTime = Date.now();
      const result = await notificationService.bulkSend(notifications);
      const endTime = Date.now();

      expect(result.successful).toBe(10);
      expect(result.failed).toBe(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle large template data efficiently', async () => {
      const notificationService = new NotificationService();
      
      const mockTemplate = {
        html: '<div>{{#each items}}<p>{{this.name}}: {{this.value}}</p>{{/each}}</div>'
      };

      notificationService.getTemplate = jest.fn().mockResolvedValue(mockTemplate);

      const largeData = {
        items: Array(1000).fill().map((_, i) => ({ name: `Item ${i}`, value: i }))
      };

      const startTime = Date.now();
      const result = await notificationService.renderEmailTemplate('test', largeData);
      const endTime = Date.now();

      expect(result.html).toContain('Item 0');
      expect(result.html).toContain('Item 999');
      expect(endTime - startTime).toBeLessThan(1000); // Should render in under 1 second
    });
  });
});

// Test utilities
const createMockNotification = (overrides = {}) => ({
  _id: 'notification123',
  recipientId: 'user123',
  type: 'otp_verification',
  status: 'pending',
  channel: 'email',
  priority: 'high',
  subject: 'Test Notification',
  content: {
    templateData: { otp: '123456' },
    personalization: { email: 'test@example.com', name: 'John Doe' }
  },
  templateId: 'otp-verification',
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date(),
  ...overrides
});

const createMockJob = (overrides = {}) => ({
  _id: 'job123',
  title: 'Software Engineer',
  company: { name: 'Tech Corp' },
  description: 'Looking for a software engineer',
  skills: ['JavaScript', 'React'],
  location: { fullLocation: 'San Francisco, CA' },
  employmentType: 'full-time',
  status: 'active',
  createdAt: new Date(),
  ...overrides
});

module.exports = {
  createMockNotification,
  createMockJob
};
