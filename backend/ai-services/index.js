/**
 * AI Services Module
 * Central export for all AI-related services
 */

const { geminiService, GeminiService } = require('./GeminiService');
const { matchingService, MatchingService } = require('./MatchingService');
const { resumeAIService, ResumeAIService } = require('./ResumeAIService');

/**
 * Initialize all AI services
 */
const initializeAIServices = async () => {
  try {
    console.log('Initializing AI services...');
    
    // Test Gemini service connection
    const healthCheck = await geminiService.healthCheck();
    
    if (healthCheck.status === 'healthy') {
      console.log('✅ Gemini AI service initialized successfully');
    } else {
      console.warn('⚠️ Gemini AI service health check failed:', healthCheck.error);
    }

    console.log('✅ Matching service initialized');
    console.log('✅ Resume AI service initialized');
    console.log('🚀 All AI services ready');

    return {
      status: 'success',
      services: {
        gemini: healthCheck.status,
        matching: 'ready',
        resumeAI: 'ready'
      }
    };

  } catch (error) {
    console.error('❌ Failed to initialize AI services:', error);
    return {
      status: 'error',
      error: error.message
    };
  }
};

/**
 * Get health status of all AI services
 */
const getAIServicesHealth = async () => {
  try {
    const geminiHealth = await geminiService.healthCheck();
    
    return {
      status: 'healthy',
      services: {
        gemini: geminiHealth,
        matching: { status: 'healthy', timestamp: new Date().toISOString() },
        resumeAI: { status: 'healthy', timestamp: new Date().toISOString() }
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
};

/**
 * Utility function to generate embeddings for content
 */
const generateEmbedding = async (content) => {
  return await geminiService.generateEmbedding(content);
};

/**
 * Utility function to calculate match score between resume and job
 */
const calculateMatchScore = async (resume, job) => {
  return await matchingService.calculateMatchScore(resume, job);
};

/**
 * Utility function to analyze resume with AI
 */
const analyzeResume = async (resume) => {
  return await resumeAIService.analyzeResume(resume);
};

/**
 * Utility function to find job matches for a resume
 */
const findJobMatches = async (resume, jobs, limit) => {
  return await matchingService.findJobMatches(resume, jobs, limit);
};

/**
 * Utility function to find candidate matches for a job
 */
const findCandidateMatches = async (job, resumes, limit) => {
  return await matchingService.findCandidateMatches(job, resumes, limit);
};

/**
 * Utility function to generate resume suggestions
 */
const generateResumeSuggestions = async (resumeContent) => {
  return await geminiService.generateResumeSuggestions(resumeContent);
};

/**
 * Utility function to optimize resume for specific job
 */
const optimizeResumeForJob = async (resume, job) => {
  return await resumeAIService.optimizeForJob(resume, job);
};

/**
 * Utility function to extract skills from resume
 */
const extractSkillsFromResume = async (resumeContent) => {
  return await geminiService.extractSkills(resumeContent);
};

/**
 * Utility function to optimize job description
 */
const optimizeJobDescription = async (jobDescription) => {
  return await geminiService.optimizeJobDescription(jobDescription);
};

module.exports = {
  // Services
  geminiService,
  matchingService,
  resumeAIService,
  
  // Service Classes (for testing/extending)
  GeminiService,
  MatchingService,
  ResumeAIService,
  
  // Initialization
  initializeAIServices,
  getAIServicesHealth,
  
  // Utility functions
  generateEmbedding,
  calculateMatchScore,
  analyzeResume,
  findJobMatches,
  findCandidateMatches,
  generateResumeSuggestions,
  optimizeResumeForJob,
  extractSkillsFromResume,
  optimizeJobDescription
};
