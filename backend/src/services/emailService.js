const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * Initialize email transporter (Brevo SMTP)
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // Use TLS
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify transporter
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email transporter verification failed:', error);
        } else {
          logger.info('Email transporter is ready');
        }
      });

    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Load email templates
   */
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      
      // Ensure templates directory exists
      try {
        await fs.access(templatesDir);
      } catch {
        await fs.mkdir(templatesDir, { recursive: true });
        await this.createDefaultTemplates(templatesDir);
      }

      const templateFiles = await fs.readdir(templatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.html')) {
          const templateName = path.basename(file, '.html');
          const templateContent = await fs.readFile(path.join(templatesDir, file), 'utf8');
          this.templates.set(templateName, templateContent);
        }
      }

      logger.info(`Loaded ${this.templates.size} email templates`);

    } catch (error) {
      logger.error('Failed to load email templates:', error);
    }
  }

  /**
   * Create default email templates
   */
  async createDefaultTemplates(templatesDir) {
    const templates = {
      emailVerification: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Resume Refresh Platform!</h1>
        </div>
        <div class="content">
            <h2>Hi {{name}},</h2>
            <p>Thank you for registering with Resume Refresh Platform. To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
            </p>
            <p>If you can't click the button, copy and paste this link into your browser:</p>
            <p>{{verificationUrl}}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Resume Refresh Platform Team</p>
            <p>Need help? Contact us at {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`,

      passwordReset: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hi {{name}},</h2>
            <p>You requested a password reset for your Resume Refresh Platform account. Click the button below to reset your password:</p>
            <p style="text-align: center;">
                <a href="{{resetUrl}}" class="button">Reset Password</a>
            </p>
            <p>If you can't click the button, copy and paste this link into your browser:</p>
            <p>{{resetUrl}}</p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Resume Refresh Platform Team</p>
            <p>Need help? Contact us at {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`,

      otpCode: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .otp { font-size: 32px; font-weight: bold; text-align: center; background: white; padding: 20px; margin: 20px 0; border-radius: 5px; letter-spacing: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your OTP Code</h1>
        </div>
        <div class="content">
            <h2>Hi {{name}},</h2>
            <p>Your one-time password (OTP) code is:</p>
            <div class="otp">{{otp}}</div>
            <p>This code will expire in {{expiryMinutes}} minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Resume Refresh Platform Team</p>
        </div>
    </div>
</body>
</html>`,

      jobAlert: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Job Matches Found!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .job-card { background: white; margin: 15px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #17a2b8; }
        .job-title { font-size: 18px; font-weight: bold; color: #17a2b8; }
        .job-company { font-weight: bold; }
        .job-location { color: #666; }
        .match-score { background: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #17a2b8; color: white; text-decoration: none; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Job Matches Found!</h1>
        </div>
        <div class="content">
            <h2>Hi {{name}},</h2>
            <p>We found {{jobCount}} new job opportunities that match your profile:</p>
            {{#jobs}}
            <div class="job-card">
                <div class="job-title">{{title}}</div>
                <div class="job-company">{{company}}</div>
                <div class="job-location">{{location}}</div>
                <div style="margin-top: 10px;">
                    <span class="match-score">{{matchScore}}% Match</span>
                </div>
            </div>
            {{/jobs}}
            <p style="text-align: center;">
                <a href="{{dashboardUrl}}" class="button">View All Jobs</a>
            </p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Resume Refresh Platform Team</p>
            <p>Don't want these emails? <a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>`
    };

    // Create template files
    for (const [name, content] of Object.entries(templates)) {
      await fs.writeFile(path.join(templatesDir, `${name}.html`), content);
    }

    logger.info('Created default email templates');
  }

  /**
   * Replace template variables
   */
  replaceVariables(template, data) {
    let result = template;
    
    // Replace simple variables {{variable}}
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }

    // Handle array iterations {{#array}} ... {{/array}}
    const arrayRegex = /{{#(\w+)}}([\s\S]*?){{\/\1}}/g;
    result = result.replace(arrayRegex, (match, arrayName, content) => {
      const array = data[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemContent = content;
        for (const [key, value] of Object.entries(item)) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          itemContent = itemContent.replace(regex, value || '');
        }
        return itemContent;
      }).join('');
    });

    return result;
  }

  /**
   * Send email
   */
  async sendEmail({ to, subject, template, data = {}, html, text, attachments = [] }) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      let emailHtml = html;
      let emailText = text;

      // Use template if specified
      if (template && this.templates.has(template)) {
        emailHtml = this.replaceVariables(this.templates.get(template), data);
      }

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Resume Refresh Platform',
          address: process.env.FROM_EMAIL || 'noreply@resumerefresh.com'
        },
        to,
        subject,
        html: emailHtml,
        text: emailText,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent successfully to ${to}`, {
        messageId: result.messageId,
        template,
        subject
      });

      return result;

    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails) {
    const results = [];
    const batchSize = 10; // Process in batches to avoid overwhelming SMTP server

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (emailData) => {
        try {
          const result = await this.sendEmail(emailData);
          return { success: true, email: emailData.to, result };
        } catch (error) {
          logger.error(`Bulk email failed for ${emailData.to}:`, error);
          return { success: false, email: emailData.to, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info(`Bulk email completed: ${successful} successful, ${failed} failed`);

    return results;
  }

  /**
   * Validate email address
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      await this.transporter.verify();
      logger.info('Email connection test successful');
      return true;
    } catch (error) {
      logger.error('Email connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export the sendEmail method for backward compatibility
const sendEmail = (options) => emailService.sendEmail(options);

module.exports = {
  emailService,
  sendEmail
};
