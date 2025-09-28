const SibApiV3Sdk = require('sib-api-v3-sdk');
const handlebars = require('handlebars');
const mjml2html = require('mjml');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../src/utils/logger');
const Notification = require('../src/models/Notification');

/**
 * Comprehensive Notification Service with Brevo SMTP Integration
 * Supports email notifications with templating, AMP, and tracking
 */
class NotificationService {
  constructor() {
    this.apiKey = process.env.BREVO_SMTP_API_KEY;
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.FROM_EMAIL;
    this.senderName = process.env.BREVO_SENDER_NAME || process.env.FROM_NAME;
    
    if (!this.apiKey) {
      logger.warn('BREVO_SMTP_API_KEY not found. Email notifications will be disabled.');
      this.enabled = false;
      return;
    }

    // Initialize Brevo API client
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = this.apiKey;

    this.transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();
    this.contactsApi = new SibApiV3Sdk.ContactsApi();
    
    this.enabled = true;
    this.templatesCache = new Map();
    this.templateDir = path.join(__dirname, 'templates');
    
    // Load templates on initialization
    this.loadTemplates();
    
    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
    
    logger.info('NotificationService initialized with Brevo SMTP');
  }

  /**
   * Send notification using appropriate channel
   */
  async sendNotification(notificationData) {
    try {
      const startTime = Date.now();
      
      // Create notification record
      const notification = await Notification.create({
        ...notificationData,
        status: 'pending'
      });

      let result;
      
      switch (notification.channel) {
        case 'email':
          result = await this.sendEmail(notification);
          break;
        case 'sms':
          result = await this.sendSMS(notification);
          break;
        case 'push':
          result = await this.sendPushNotification(notification);
          break;
        default:
          throw new Error(`Unsupported notification channel: ${notification.channel}`);
      }

      // Update notification with success
      await notification.markAsSent(result.messageId, result);
      
      const processingTime = Date.now() - startTime;
      notification.processingTime = processingTime;
      await notification.save();

      logger.info(`Notification sent successfully: ${notification._id} (${processingTime}ms)`);
      return { success: true, notification, result };

    } catch (error) {
      logger.error('Notification sending failed:', error);
      
      if (notificationData._id) {
        const notification = await Notification.findById(notificationData._id);
        if (notification) {
          await notification.markAsFailed(error.message, error.code, error.details);
        }
      }
      
      throw error;
    }
  }

  /**
   * Send email notification via Brevo
   */
  async sendEmail(notification) {
    try {
      if (!this.enabled) {
        throw new Error('Brevo SMTP is not configured');
      }

      // Render email content
      const emailContent = await this.renderEmailTemplate(
        notification.templateId,
        notification.content.templateData || {}
      );

      // Prepare email data
      const emailData = {
        sender: {
          email: this.senderEmail,
          name: this.senderName
        },
        to: [{
          email: notification.content.personalization.email,
          name: notification.content.personalization.name || notification.content.personalization.firstName
        }],
        subject: notification.subject,
        htmlContent: emailContent.html,
        textContent: emailContent.text || this.stripHtml(emailContent.html)
      };

      // Add AMP content if available
      if (emailContent.amp) {
        emailData.ampContent = emailContent.amp;
      }

      // Add tracking parameters
      if (notification.metadata?.campaignId) {
        emailData.tags = [notification.metadata.campaignId];
      }

      // Add custom headers for tracking
      emailData.headers = {
        'X-Notification-ID': notification._id.toString(),
        'X-Notification-Type': notification.type,
        'X-User-ID': notification.recipientId.toString()
      };

      // Add unsubscribe link
      if (notification.unsubscribeToken) {
        const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe/${notification.unsubscribeToken}`;
        emailData.headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
      }

      // Send email via Brevo
      const response = await this.transactionalEmailsApi.sendTransacEmail(emailData);

      logger.info(`Email sent via Brevo: ${response.messageId}`);
      
      return {
        messageId: response.messageId,
        provider: 'brevo',
        response
      };

    } catch (error) {
      logger.error('Brevo email sending failed:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Send SMS notification (placeholder for future implementation)
   */
  async sendSMS(notification) {
    // TODO: Implement SMS sending via Brevo SMS API or other provider
    throw new Error('SMS notifications not yet implemented');
  }

  /**
   * Send push notification (placeholder for future implementation)
   */
  async sendPushNotification(notification) {
    // TODO: Implement push notifications via FCM or similar
    throw new Error('Push notifications not yet implemented');
  }

  /**
   * Send OTP verification email
   */
  async sendOTPVerification(recipientId, email, name, otp) {
    return this.sendNotification({
      recipientId,
      type: 'otp_verification',
      channel: 'email',
      priority: 'high',
      subject: 'Verify Your Email Address',
      templateId: 'otp-verification',
      content: {
        templateData: {
          otp,
          expiryMinutes: 5,
          supportEmail: process.env.SUPPORT_EMAIL
        },
        personalization: {
          email,
          name,
          firstName: name.split(' ')[0]
        }
      }
    });
  }

  /**
   * Send job match notification
   */
  async sendJobMatchNotification(recipientId, email, name, jobData, matchScore) {
    return this.sendNotification({
      recipientId,
      type: 'job_match',
      channel: 'email',
      priority: 'normal',
      subject: `New Job Match: ${jobData.title} (${matchScore}% match)`,
      templateId: 'job-match',
      content: {
        templateData: {
          jobTitle: jobData.title,
          companyName: jobData.company.name,
          matchScore,
          jobLocation: jobData.location.fullLocation,
          jobUrl: `${process.env.FRONTEND_URL}/jobs/${jobData.id}`,
          salary: jobData.salary?.range,
          employmentType: jobData.employmentType,
          workMode: jobData.location.workMode,
          postedDate: jobData.createdAt,
          requirements: jobData.requirements?.slice(0, 5) || [],
          skills: jobData.skills?.slice(0, 10) || []
        },
        personalization: {
          email,
          name,
          firstName: name.split(' ')[0]
        }
      },
      metadata: {
        jobId: jobData.id,
        matchScore,
        source: 'ai_matching'
      }
    });
  }

  /**
   * Send weekly resume refresh reminder (AMP email)
   */
  async sendResumeRefreshReminder(recipientId, email, name, profileData) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(profileData.lastProfileUpdate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return this.sendNotification({
      recipientId,
      type: 'resume_refresh_reminder',
      channel: 'email',
      priority: 'normal',
      subject: `Time to refresh your resume! (${daysSinceUpdate} days since last update)`,
      templateId: 'resume-refresh-reminder',
      content: {
        templateData: {
          daysSinceUpdate,
          profileCompletion: profileData.profileCompletion,
          suggestions: profileData.suggestions || [],
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          profileUrl: `${process.env.FRONTEND_URL}/profile`,
          resumeUrl: `${process.env.FRONTEND_URL}/resume`,
          jobsUrl: `${process.env.FRONTEND_URL}/jobs`,
          // AMP form data
          ampFormEndpoint: `${process.env.API_URL}/api/notifications/amp/profile-update`,
          ampFormToken: this.generateAMPToken(recipientId)
        },
        personalization: {
          email,
          name,
          firstName: name.split(' ')[0]
        }
      },
      metadata: {
        resumeId: profileData.resumeId,
        daysSinceUpdate,
        source: 'weekly_reminder'
      }
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(recipientId, email, name, role) {
    return this.sendNotification({
      recipientId,
      type: 'welcome',
      channel: 'email',
      priority: 'high',
      subject: `Welcome to Resume Refresh Platform!`,
      templateId: 'welcome',
      content: {
        templateData: {
          role,
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          profileUrl: `${process.env.FRONTEND_URL}/profile`,
          supportEmail: process.env.SUPPORT_EMAIL,
          nextSteps: this.getWelcomeNextSteps(role)
        },
        personalization: {
          email,
          name,
          firstName: name.split(' ')[0]
        }
      }
    });
  }

  /**
   * Send application status update
   */
  async sendApplicationStatusUpdate(recipientId, email, name, applicationData) {
    return this.sendNotification({
      recipientId,
      type: 'application_status',
      channel: 'email',
      priority: 'high',
      subject: `Application Update: ${applicationData.jobTitle}`,
      templateId: 'application-status',
      content: {
        templateData: {
          jobTitle: applicationData.jobTitle,
          companyName: applicationData.companyName,
          status: applicationData.status,
          statusMessage: this.getStatusMessage(applicationData.status),
          applicationUrl: `${process.env.FRONTEND_URL}/applications/${applicationData.id}`,
          nextSteps: this.getApplicationNextSteps(applicationData.status)
        },
        personalization: {
          email,
          name,
          firstName: name.split(' ')[0]
        }
      },
      metadata: {
        applicationId: applicationData.id,
        jobId: applicationData.jobId,
        status: applicationData.status
      }
    });
  }

  /**
   * Render email template with data
   */
  async renderEmailTemplate(templateId, data) {
    try {
      const template = await this.getTemplate(templateId);
      
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const result = {};

      // Render HTML content
      if (template.html) {
        const htmlTemplate = handlebars.compile(template.html);
        result.html = htmlTemplate(data);
      }

      // Render text content
      if (template.text) {
        const textTemplate = handlebars.compile(template.text);
        result.text = textTemplate(data);
      }

      // Render AMP content
      if (template.amp) {
        const ampTemplate = handlebars.compile(template.amp);
        result.amp = ampTemplate(data);
      }

      // If MJML template, compile to HTML
      if (template.mjml) {
        const mjmlTemplate = handlebars.compile(template.mjml);
        const mjmlContent = mjmlTemplate(data);
        const mjmlResult = mjml2html(mjmlContent);
        
        if (mjmlResult.errors.length > 0) {
          logger.warn('MJML template errors:', mjmlResult.errors);
        }
        
        result.html = mjmlResult.html;
      }

      return result;

    } catch (error) {
      logger.error(`Template rendering failed for ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Load email templates from files
   */
  async loadTemplates() {
    try {
      const templateFiles = await fs.readdir(this.templateDir);
      
      for (const file of templateFiles) {
        const filePath = path.join(this.templateDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const ext = path.extname(file);
          const templateId = path.basename(file, ext);
          
          const content = await fs.readFile(filePath, 'utf8');
          
          if (!this.templatesCache.has(templateId)) {
            this.templatesCache.set(templateId, {});
          }
          
          const template = this.templatesCache.get(templateId);
          
          switch (ext) {
            case '.hbs':
            case '.handlebars':
              template.html = content;
              break;
            case '.txt':
              template.text = content;
              break;
            case '.mjml':
              template.mjml = content;
              break;
            case '.amp.html':
              template.amp = content;
              break;
            default:
              template.html = content;
          }
          
          this.templatesCache.set(templateId, template);
        }
      }
      
      logger.info(`Loaded ${this.templatesCache.size} email templates`);
      
    } catch (error) {
      logger.error('Failed to load email templates:', error);
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId) {
    if (this.templatesCache.has(templateId)) {
      return this.templatesCache.get(templateId);
    }
    
    // Try to load template if not in cache
    await this.loadTemplates();
    return this.templatesCache.get(templateId);
  }

  /**
   * Register Handlebars helpers
   */
  registerHandlebarsHelpers() {
    // Format date helper
    handlebars.registerHelper('formatDate', function(date, format = 'MMMM DD, YYYY') {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    // Format currency helper
    handlebars.registerHelper('formatCurrency', function(amount, currency = 'USD') {
      if (!amount) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    });

    // Capitalize helper
    handlebars.registerHelper('capitalize', function(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Truncate helper
    handlebars.registerHelper('truncate', function(str, length = 100) {
      if (!str) return '';
      return str.length > length ? str.substring(0, length) + '...' : str;
    });

    // Conditional helper
    handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // Loop with index helper
    handlebars.registerHelper('eachWithIndex', function(array, options) {
      let result = '';
      for (let i = 0; i < array.length; i++) {
        result += options.fn({ ...array[i], index: i });
      }
      return result;
    });

    // Math helpers
    handlebars.registerHelper('add', function(a, b) {
      return a + b;
    });

    handlebars.registerHelper('subtract', function(a, b) {
      return a - b;
    });

    handlebars.registerHelper('multiply', function(a, b) {
      return a * b;
    });

    // URL helpers
    handlebars.registerHelper('urlEncode', function(str) {
      return encodeURIComponent(str);
    });

    // Array helpers
    handlebars.registerHelper('join', function(array, separator = ', ') {
      return Array.isArray(array) ? array.join(separator) : '';
    });

    handlebars.registerHelper('first', function(array, count = 1) {
      return Array.isArray(array) ? array.slice(0, count) : [];
    });

    // Progress bar helper
    handlebars.registerHelper('progressBar', function(value, max = 100, width = 200) {
      const percentage = Math.min(100, (value / max) * 100);
      return `<div style="width: ${width}px; height: 20px; background: #f0f0f0; border-radius: 10px;">
        <div style="width: ${percentage}%; height: 100%; background: #007bff; border-radius: 10px;"></div>
      </div>`;
    });
  }

  /**
   * Generate AMP form token for security
   */
  generateAMPToken(recipientId) {
    const crypto = require('crypto');
    const payload = {
      recipientId: recipientId.toString(),
      timestamp: Date.now(),
      action: 'profile_update'
    };
    
    const secret = process.env.JWT_SECRET;
    const token = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return Buffer.from(JSON.stringify({ ...payload, token })).toString('base64');
  }

  /**
   * Verify AMP form token
   */
  verifyAMPToken(tokenString) {
    try {
      const payload = JSON.parse(Buffer.from(tokenString, 'base64').toString());
      const { recipientId, timestamp, action, token } = payload;
      
      // Check if token is not too old (1 hour)
      if (Date.now() - timestamp > 60 * 60 * 1000) {
        return { valid: false, error: 'Token expired' };
      }
      
      // Verify token
      const crypto = require('crypto');
      const secret = process.env.JWT_SECRET;
      const expectedToken = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify({ recipientId, timestamp, action }))
        .digest('hex');
      
      if (token !== expectedToken) {
        return { valid: false, error: 'Invalid token' };
      }
      
      return { valid: true, recipientId, action };
      
    } catch (error) {
      return { valid: false, error: 'Malformed token' };
    }
  }

  /**
   * Strip HTML tags from content
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Get welcome next steps based on role
   */
  getWelcomeNextSteps(role) {
    const steps = {
      candidate: [
        'Complete your profile',
        'Upload your resume',
        'Browse job opportunities',
        'Set up job alerts'
      ],
      recruiter: [
        'Set up your company profile',
        'Post your first job',
        'Browse candidate profiles',
        'Set up hiring workflows'
      ],
      admin: [
        'Review system settings',
        'Monitor user activity',
        'Configure notifications',
        'Manage user accounts'
      ]
    };
    
    return steps[role] || steps.candidate;
  }

  /**
   * Get status message for application updates
   */
  getStatusMessage(status) {
    const messages = {
      'pending': 'Your application is being reviewed',
      'reviewing': 'Your application is currently under review',
      'shortlisted': 'Congratulations! You\'ve been shortlisted',
      'interviewed': 'Thank you for the interview',
      'offered': 'Congratulations! You\'ve received an offer',
      'hired': 'Welcome to the team!',
      'rejected': 'Thank you for your interest'
    };
    
    return messages[status] || 'Your application status has been updated';
  }

  /**
   * Get next steps for application status
   */
  getApplicationNextSteps(status) {
    const steps = {
      'pending': ['Wait for recruiter review', 'Keep your profile updated'],
      'reviewing': ['Prepare for potential interview', 'Research the company'],
      'shortlisted': ['Prepare for interview', 'Review job requirements'],
      'interviewed': ['Wait for final decision', 'Send thank you note'],
      'offered': ['Review offer details', 'Negotiate if needed', 'Accept or decline'],
      'hired': ['Complete onboarding', 'Prepare for first day'],
      'rejected': ['Apply to similar positions', 'Update your resume']
    };
    
    return steps[status] || ['Continue your job search'];
  }

  /**
   * Bulk send notifications
   */
  async bulkSend(notifications) {
    const results = [];
    const batchId = require('crypto').randomBytes(16).toString('hex');
    
    for (const notificationData of notifications) {
      try {
        const result = await this.sendNotification({
          ...notificationData,
          batchId,
          batchSize: notifications.length
        });
        results.push(result);
      } catch (error) {
        results.push({ success: false, error: error.message, data: notificationData });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    logger.info(`Bulk send completed: ${successful} successful, ${failed} failed (batch: ${batchId})`);
    
    return {
      batchId,
      total: notifications.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Health check for the notification service
   */
  async healthCheck() {
    try {
      if (!this.enabled) {
        return { status: 'disabled', message: 'Brevo SMTP not configured' };
      }

      // Test API connection
      await this.transactionalEmailsApi.getTransacEmailsList({ limit: 1 });
      
      return { 
        status: 'healthy', 
        provider: 'brevo',
        templates: this.templatesCache.size,
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
}

// Export singleton instance
const notificationService = new NotificationService();

module.exports = {
  notificationService,
  NotificationService
};
