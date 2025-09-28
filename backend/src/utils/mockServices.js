/**
 * Mock Services for Development
 * Provides mock implementations when external APIs are not configured
 */

const logger = require('./logger');

/**
 * Mock AI Service for development
 */
class MockAIService {
  constructor() {
    this.isInitialized = true;
    logger.info('MockAIService initialized - AI features will return mock data');
  }

  async generateEmbedding(text) {
    // Return mock embedding vector
    const mockEmbedding = Array.from({ length: 768 }, () => Math.random() * 2 - 1);
    
    logger.debug('Generated mock embedding for text:', text.substring(0, 50) + '...');
    
    return {
      embedding: mockEmbedding,
      metadata: {
        model: 'mock-embedding-model',
        timestamp: new Date().toISOString(),
        textLength: text.length
      }
    };
  }

  async generateSuggestions(resumeText, jobDescription = null) {
    // Return mock suggestions
    const mockSuggestions = [
      {
        type: 'skills',
        priority: 'high',
        suggestion: 'Add more specific technical skills like "React.js" instead of just "JavaScript"',
        category: 'Technical Skills'
      },
      {
        type: 'formatting',
        priority: 'medium',
        suggestion: 'Use bullet points for better readability in your experience section',
        category: 'Formatting'
      },
      {
        type: 'keywords',
        priority: 'high',
        suggestion: 'Include industry-specific keywords to improve ATS compatibility',
        category: 'ATS Optimization'
      },
      {
        type: 'content',
        priority: 'medium',
        suggestion: 'Quantify your achievements with specific numbers and metrics',
        category: 'Content Enhancement'
      }
    ];

    logger.debug('Generated mock AI suggestions');
    
    return {
      suggestions: mockSuggestions,
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
      metadata: {
        model: 'mock-suggestion-model',
        timestamp: new Date().toISOString(),
        analysisType: jobDescription ? 'job-specific' : 'general'
      }
    };
  }

  async calculateSimilarity(embedding1, embedding2) {
    // Return mock similarity score
    const similarity = Math.random() * 0.4 + 0.6; // 0.6-1.0
    
    logger.debug('Calculated mock similarity score:', similarity);
    
    return similarity;
  }

  async matchJobToResume(jobEmbedding, resumeEmbedding, jobData, resumeData) {
    // Return mock match result
    const overallScore = Math.floor(Math.random() * 40) + 60; // 60-100
    
    const mockMatch = {
      overallScore,
      breakdown: {
        skills: Math.floor(Math.random() * 30) + 70,
        experience: Math.floor(Math.random() * 30) + 65,
        keywords: Math.floor(Math.random() * 25) + 75,
        location: Math.floor(Math.random() * 20) + 80
      },
      matchedSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'].slice(0, Math.floor(Math.random() * 4) + 1),
      missingSkills: ['TypeScript', 'AWS', 'Docker'].slice(0, Math.floor(Math.random() * 3)),
      recommendations: [
        'Strong technical skills match',
        'Experience level aligns well',
        'Consider highlighting project management experience'
      ]
    };

    logger.debug('Generated mock job-resume match:', { overallScore });
    
    return mockMatch;
  }
}

/**
 * Mock Email Service for development
 */
class MockEmailService {
  constructor() {
    this.isInitialized = true;
    logger.info('MockEmailService initialized - emails will be logged instead of sent');
  }

  async sendEmail(emailData) {
    const { to, subject, body, template, templateData } = emailData;
    
    // Log email instead of sending
    logger.info('📧 Mock Email Sent:', {
      to,
      subject,
      template: template || 'custom',
      timestamp: new Date().toISOString()
    });
    
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Email content:', { body: body?.substring(0, 100), templateData });
    }
    
    // Return mock success response
    return {
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  }

  async sendOTP(email, otp) {
    logger.info('📧 Mock OTP Email:', { email, otp, timestamp: new Date().toISOString() });
    
    return {
      messageId: `mock-otp-${Date.now()}`,
      status: 'sent',
      otp: otp // In development, return OTP for testing
    };
  }

  async sendJobMatchNotification(candidateEmail, jobData, matchScore) {
    logger.info('📧 Mock Job Match Email:', { 
      candidateEmail, 
      jobTitle: jobData.title, 
      matchScore,
      timestamp: new Date().toISOString()
    });
    
    return {
      messageId: `mock-job-match-${Date.now()}`,
      status: 'sent'
    };
  }

  async sendResumeRefreshReminder(candidateEmail, profileData) {
    logger.info('📧 Mock Resume Refresh Email:', { 
      candidateEmail, 
      profileCompletion: profileData.completionPercentage,
      timestamp: new Date().toISOString()
    });
    
    return {
      messageId: `mock-resume-refresh-${Date.now()}`,
      status: 'sent'
    };
  }
}

/**
 * Mock Notification Queue for development
 */
class MockNotificationQueue {
  constructor() {
    this.queue = [];
    this.processed = 0;
    this.failed = 0;
    logger.info('MockNotificationQueue initialized - notifications will be processed immediately');
  }

  async add(jobName, data, options = {}) {
    logger.info('📬 Mock Queue Job Added:', { jobName, data: Object.keys(data), options });
    
    // Simulate immediate processing
    setTimeout(() => {
      this.processJob(jobName, data);
    }, 100);
    
    return {
      id: `mock-job-${Date.now()}`,
      name: jobName,
      data,
      options
    };
  }

  async processJob(jobName, data) {
    try {
      // Simulate processing
      this.processed++;
      logger.debug('✅ Mock job processed:', jobName);
      
      return { status: 'completed', result: data };
    } catch (error) {
      this.failed++;
      logger.error('❌ Mock job failed:', jobName, error.message);
      throw error;
    }
  }

  async getStats() {
    return {
      waiting: this.queue.length,
      active: 0,
      completed: this.processed,
      failed: this.failed
    };
  }

  async retryFailed() {
    logger.info('🔄 Mock retry failed jobs - no failed jobs in development');
    return { retried: 0 };
  }
}

/**
 * Check if we should use mock services
 */
const shouldUseMockServices = () => {
  const useMockAI = process.env.MOCK_AI_SERVICES === 'true' || !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock-gemini-api-key-for-development';
  const useMockEmail = process.env.MOCK_EMAIL_SERVICES === 'true' || !process.env.BREVO_SMTP_API_KEY || process.env.BREVO_SMTP_API_KEY === 'mock-smtp-key-for-development';
  
  return { useMockAI, useMockEmail };
};

/**
 * Initialize mock services based on configuration
 */
const initializeMockServices = () => {
  const { useMockAI, useMockEmail } = shouldUseMockServices();
  const services = {};
  
  if (useMockAI) {
    services.aiService = new MockAIService();
    logger.info('🤖 Using Mock AI Service - no external API calls will be made');
  }
  
  if (useMockEmail) {
    services.emailService = new MockEmailService();
    services.notificationQueue = new MockNotificationQueue();
    logger.info('📧 Using Mock Email Service - emails will be logged instead of sent');
  }
  
  return services;
};

/**
 * Development data generators
 */
const generateMockData = {
  user: (role = 'candidate') => ({
    firstName: 'John',
    lastName: 'Doe',
    email: `john.doe.${role}@example.com`,
    role,
    profile: {
      completionPercentage: Math.floor(Math.random() * 40) + 60,
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      location: { city: 'San Francisco', state: 'CA', country: 'United States' }
    },
    createdAt: new Date(),
    lastLoginAt: new Date()
  }),
  
  job: () => ({
    title: 'Senior Software Engineer',
    description: 'We are looking for a talented software engineer...',
    company: { name: 'Tech Corp Inc', website: 'https://techcorp.com' },
    location: { city: 'San Francisco', state: 'CA', workMode: 'hybrid' },
    skills: ['JavaScript', 'React', 'Node.js', 'AWS'],
    salary: { min: 120000, max: 180000, currency: 'USD', period: 'yearly' },
    employmentType: 'full-time',
    status: 'active',
    createdAt: new Date()
  }),
  
  notification: () => ({
    type: 'job_match',
    subject: 'New Job Match Found!',
    status: 'sent',
    createdAt: new Date(),
    sentAt: new Date(),
    metadata: { matchScore: Math.floor(Math.random() * 30) + 70 }
  })
};

module.exports = {
  MockAIService,
  MockEmailService,
  MockNotificationQueue,
  shouldUseMockServices,
  initializeMockServices,
  generateMockData
};
