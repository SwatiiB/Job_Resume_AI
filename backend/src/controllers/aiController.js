const Resume = require('../models/Resume');
const Job = require('../models/Job');
const User = require('../models/User');
const logger = require('../utils/logger');

// Import AI services
const {
  generateEmbedding,
  calculateMatchScore,
  analyzeResume,
  findJobMatches,
  findCandidateMatches,
  generateResumeSuggestions,
  optimizeResumeForJob,
  extractSkillsFromResume,
  optimizeJobDescription,
  getAIServicesHealth
} = require('../../ai-services');

/**
 * @desc    Get AI services health status
 * @route   GET /api/ai/health
 * @access  Private (Admin)
 */
const getHealthStatus = async (req, res, next) => {
  try {
    const healthStatus = await getAIServicesHealth();

    res.status(200).json({
      success: true,
      data: healthStatus
    });

  } catch (error) {
    logger.error('AI health check error:', error);
    next(error);
  }
};

/**
 * @desc    Generate embedding for text content
 * @route   POST /api/ai/embedding
 * @access  Private
 */
const generateTextEmbedding = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }

    const embedding = await generateEmbedding(text);

    logger.info(`Generated embedding with ${embedding.length} dimensions`);

    res.status(200).json({
      success: true,
      data: {
        embedding,
        dimensions: embedding.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Embedding generation error:', error);
    next(error);
  }
};

/**
 * @desc    Calculate match score between resume and job
 * @route   POST /api/ai/match/resume-to-job
 * @access  Private
 */
const matchResumeToJob = async (req, res, next) => {
  try {
    const { resumeId, jobId } = req.body;

    if (!resumeId || !jobId) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID and Job ID are required'
      });
    }

    // Get resume and job
    const [resume, job] = await Promise.all([
      Resume.findById(resumeId).populate('userId', 'profile'),
      Job.findById(jobId).populate('postedBy', 'profile')
    ]);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check access permissions
    const canAccess = 
      req.user.id.toString() === resume.userId._id.toString() ||
      req.user.id.toString() === job.postedBy._id.toString() ||
      req.user.role === 'admin';

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Generate embeddings if not present
    await ensureEmbeddings(resume, job);

    // Calculate match score
    const matchResult = await calculateMatchScore(resume, job);

    logger.info(`Match calculated: ${matchResult.overallScore}% between resume ${resumeId} and job ${jobId}`);

    res.status(200).json({
      success: true,
      data: {
        resumeId,
        jobId,
        ...matchResult,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Resume to job matching error:', error);
    next(error);
  }
};

/**
 * @desc    Find job matches for a resume
 * @route   POST /api/ai/match/job-recommendations
 * @access  Private (Candidate)
 */
const getJobRecommendations = async (req, res, next) => {
  try {
    const { resumeId, limit = 10, filters = {} } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID is required'
      });
    }

    const resume = await Resume.findById(resumeId).populate('userId', 'profile');

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && resume.userId._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Build job query with filters
    const jobQuery = { status: 'active' };
    
    if (filters.location) {
      jobQuery['location.city'] = { $regex: filters.location, $options: 'i' };
    }
    
    if (filters.employmentType) {
      jobQuery.employmentType = { $in: Array.isArray(filters.employmentType) ? filters.employmentType : [filters.employmentType] };
    }
    
    if (filters.workMode) {
      jobQuery['location.workMode'] = { $in: Array.isArray(filters.workMode) ? filters.workMode : [filters.workMode] };
    }

    if (filters.salaryMin) {
      jobQuery['salary.min'] = { $gte: filters.salaryMin };
    }

    // Get available jobs
    const jobs = await Job.find(jobQuery)
      .populate('postedBy', 'profile')
      .limit(100) // Limit to prevent performance issues
      .sort({ createdAt: -1 });

    // Generate embeddings if needed
    await ensureResumeEmbedding(resume);

    // Find matches
    const recommendations = await findJobMatches(resume, jobs, limit);

    logger.info(`Found ${recommendations.matches.length} job recommendations for resume ${resumeId}`);

    res.status(200).json({
      success: true,
      data: {
        resumeId,
        ...recommendations,
        filters,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Job recommendations error:', error);
    next(error);
  }
};

/**
 * @desc    Find candidate matches for a job
 * @route   POST /api/ai/match/candidate-recommendations
 * @access  Private (Recruiter/Admin)
 */
const getCandidateRecommendations = async (req, res, next) => {
  try {
    const { jobId, limit = 10, filters = {} } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    const job = await Job.findById(jobId).populate('postedBy', 'profile');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && job.postedBy._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Build resume query with filters
    const resumeQuery = { isActive: true };
    
    if (filters.minAtsScore) {
      resumeQuery.atsScore = { $gte: filters.minAtsScore };
    }
    
    if (filters.skills) {
      const skills = Array.isArray(filters.skills) ? filters.skills : [filters.skills];
      resumeQuery['extractedSkills.skill'] = { $in: skills.map(skill => new RegExp(skill, 'i')) };
    }

    if (filters.experience) {
      // This would require more complex querying based on parsed experience
      // For now, we'll skip this filter
    }

    // Get available resumes
    const resumes = await Resume.find(resumeQuery)
      .populate('userId', 'profile email')
      .limit(200) // Limit to prevent performance issues
      .sort({ atsScore: -1, createdAt: -1 });

    // Generate embeddings if needed
    await ensureJobEmbedding(job);

    // Find matches
    const recommendations = await findCandidateMatches(job, resumes, limit);

    logger.info(`Found ${recommendations.matches.length} candidate recommendations for job ${jobId}`);

    res.status(200).json({
      success: true,
      data: {
        jobId,
        jobTitle: job.title,
        company: job.company.name,
        ...recommendations,
        filters,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Candidate recommendations error:', error);
    next(error);
  }
};

/**
 * @desc    Analyze resume with AI
 * @route   POST /api/ai/analyze/resume
 * @access  Private
 */
const analyzeResumeWithAI = async (req, res, next) => {
  try {
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID is required'
      });
    }

    const resume = await Resume.findById(resumeId).populate('userId', 'profile');

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && resume.userId._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Analyze resume
    const analysis = await analyzeResume(resume);

    // Update resume with AI suggestions if provided
    if (analysis.suggestions && analysis.suggestions.enhanced) {
      resume.aiSuggestions = analysis.suggestions.enhanced;
      await resume.save({ validateBeforeSave: false });
    }

    logger.info(`AI analysis completed for resume ${resumeId} with score ${analysis.overallScore}`);

    res.status(200).json({
      success: true,
      data: {
        resumeId,
        ...analysis
      }
    });

  } catch (error) {
    logger.error('Resume AI analysis error:', error);
    next(error);
  }
};

/**
 * @desc    Generate resume improvement suggestions
 * @route   POST /api/ai/suggestions/resume
 * @access  Private
 */
const getResumeSuggestions = async (req, res, next) => {
  try {
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID is required'
      });
    }

    const resume = await Resume.findById(resumeId).populate('userId', 'profile');

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && resume.userId._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!resume.parsedContent?.rawText) {
      return res.status(400).json({
        success: false,
        error: 'Resume content not available for analysis'
      });
    }

    // Generate suggestions
    const suggestions = await generateResumeSuggestions(resume.parsedContent.rawText);

    // Update resume with suggestions
    const enhancedSuggestions = suggestions.suggestions.map(suggestion => ({
      ...suggestion,
      createdAt: new Date(),
      applied: false
    }));

    resume.aiSuggestions = enhancedSuggestions;
    await resume.save({ validateBeforeSave: false });

    logger.info(`Generated ${suggestions.suggestions.length} suggestions for resume ${resumeId}`);

    res.status(200).json({
      success: true,
      data: {
        resumeId,
        ...suggestions,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Resume suggestions error:', error);
    next(error);
  }
};

/**
 * @desc    Optimize resume for specific job
 * @route   POST /api/ai/optimize/resume-for-job
 * @access  Private
 */
const optimizeResumeForSpecificJob = async (req, res, next) => {
  try {
    const { resumeId, jobId } = req.body;

    if (!resumeId || !jobId) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID and Job ID are required'
      });
    }

    const [resume, job] = await Promise.all([
      Resume.findById(resumeId).populate('userId', 'profile'),
      Job.findById(jobId).populate('postedBy', 'profile')
    ]);

    if (!resume || !job) {
      return res.status(404).json({
        success: false,
        error: 'Resume or Job not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && resume.userId._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Optimize resume for job
    const optimization = await optimizeResumeForJob(resume, job);

    logger.info(`Resume ${resumeId} optimized for job ${jobId}`);

    res.status(200).json({
      success: true,
      data: optimization
    });

  } catch (error) {
    logger.error('Resume optimization error:', error);
    next(error);
  }
};

/**
 * @desc    Extract skills from resume content
 * @route   POST /api/ai/extract/skills
 * @access  Private
 */
const extractSkills = async (req, res, next) => {
  try {
    const { resumeId, content } = req.body;

    let resumeContent = content;

    if (resumeId) {
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        return res.status(404).json({
          success: false,
          error: 'Resume not found'
        });
      }

      // Check ownership
      if (req.user.role !== 'admin' && resume.userId.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      resumeContent = resume.parsedContent?.rawText;
    }

    if (!resumeContent) {
      return res.status(400).json({
        success: false,
        error: 'Resume content is required'
      });
    }

    // Extract skills
    const skillsResult = await extractSkillsFromResume(resumeContent);

    // Update resume with extracted skills if resumeId provided
    if (resumeId) {
      const resume = await Resume.findById(resumeId);
      resume.extractedSkills = skillsResult.skills.map(skill => ({
        skill: skill.skill,
        confidence: skill.confidence,
        context: skill.context,
        category: skill.category
      }));
      await resume.save({ validateBeforeSave: false });
    }

    logger.info(`Extracted ${skillsResult.skills.length} skills`);

    res.status(200).json({
      success: true,
      data: {
        resumeId,
        ...skillsResult,
        extractedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Skills extraction error:', error);
    next(error);
  }
};

/**
 * @desc    Optimize job description
 * @route   POST /api/ai/optimize/job-description
 * @access  Private (Recruiter/Admin)
 */
const optimizeJobDescriptionWithAI = async (req, res, next) => {
  try {
    const { jobId, description } = req.body;

    let jobDescription = description;

    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // Check ownership
      if (req.user.role !== 'admin' && job.postedBy.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      jobDescription = job.description;
    }

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        error: 'Job description is required'
      });
    }

    // Optimize job description
    const optimization = await optimizeJobDescription(jobDescription);

    logger.info(`Job description optimized${jobId ? ` for job ${jobId}` : ''}`);

    res.status(200).json({
      success: true,
      data: {
        jobId,
        ...optimization,
        optimizedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Job description optimization error:', error);
    next(error);
  }
};

/**
 * @desc    Bulk generate embeddings for resumes
 * @route   POST /api/ai/embeddings/resumes/bulk
 * @access  Private (Admin)
 */
const bulkGenerateResumeEmbeddings = async (req, res, next) => {
  try {
    const { limit = 50 } = req.body;

    // Find resumes without embeddings
    const resumes = await Resume.find({
      embedding: { $exists: false },
      'parsedContent.rawText': { $exists: true }
    }).limit(limit);

    if (resumes.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No resumes need embedding generation',
        processed: 0
      });
    }

    let processed = 0;
    const errors = [];

    for (const resume of resumes) {
      try {
        await ensureResumeEmbedding(resume);
        processed++;
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error generating embedding for resume ${resume._id}:`, error);
        errors.push({ resumeId: resume._id, error: error.message });
      }
    }

    logger.info(`Bulk generated embeddings for ${processed} resumes`);

    res.status(200).json({
      success: true,
      data: {
        total: resumes.length,
        processed,
        errors: errors.length,
        errorDetails: errors
      }
    });

  } catch (error) {
    logger.error('Bulk resume embeddings error:', error);
    next(error);
  }
};

/**
 * @desc    Bulk generate embeddings for jobs
 * @route   POST /api/ai/embeddings/jobs/bulk
 * @access  Private (Admin)
 */
const bulkGenerateJobEmbeddings = async (req, res, next) => {
  try {
    const { limit = 50 } = req.body;

    // Find jobs without embeddings
    const jobs = await Job.find({
      embedding: { $exists: false },
      status: 'active'
    }).limit(limit);

    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No jobs need embedding generation',
        processed: 0
      });
    }

    let processed = 0;
    const errors = [];

    for (const job of jobs) {
      try {
        await ensureJobEmbedding(job);
        processed++;
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error generating embedding for job ${job._id}:`, error);
        errors.push({ jobId: job._id, error: error.message });
      }
    }

    logger.info(`Bulk generated embeddings for ${processed} jobs`);

    res.status(200).json({
      success: true,
      data: {
        total: jobs.length,
        processed,
        errors: errors.length,
        errorDetails: errors
      }
    });

  } catch (error) {
    logger.error('Bulk job embeddings error:', error);
    next(error);
  }
};

/**
 * Helper function to ensure resume has embedding
 */
const ensureResumeEmbedding = async (resume) => {
  if (!resume.embedding && resume.parsedContent?.rawText) {
    const content = buildResumeEmbeddingContent(resume);
    const embedding = await generateEmbedding(content);
    
    resume.embedding = embedding;
    resume.embeddingMetadata = {
      model: 'embedding-001',
      dimensions: embedding.length,
      generatedAt: new Date(),
      version: '1.0'
    };
    
    await resume.save({ validateBeforeSave: false });
    logger.debug(`Generated embedding for resume ${resume._id}`);
  }
};

/**
 * Helper function to ensure job has embedding
 */
const ensureJobEmbedding = async (job) => {
  if (!job.embedding) {
    const content = buildJobEmbeddingContent(job);
    const embedding = await generateEmbedding(content);
    
    job.embedding = embedding;
    job.embeddingMetadata = {
      model: 'embedding-001',
      dimensions: embedding.length,
      generatedAt: new Date(),
      version: '1.0'
    };
    
    await job.save({ validateBeforeSave: false });
    logger.debug(`Generated embedding for job ${job._id}`);
  }
};

/**
 * Helper function to ensure both resume and job have embeddings
 */
const ensureEmbeddings = async (resume, job) => {
  await Promise.all([
    ensureResumeEmbedding(resume),
    ensureJobEmbedding(job)
  ]);
};

/**
 * Build content for resume embedding
 */
const buildResumeEmbeddingContent = (resume) => {
  const parts = [];

  if (resume.parsedContent?.personalInfo?.summary) {
    parts.push(`Summary: ${resume.parsedContent.personalInfo.summary}`);
  }

  if (resume.parsedContent?.experience) {
    const experience = resume.parsedContent.experience
      .map(exp => `${exp.position} at ${exp.company}: ${exp.description || ''}`)
      .join('. ');
    parts.push(`Experience: ${experience}`);
  }

  if (resume.parsedContent?.skills?.technical) {
    parts.push(`Technical Skills: ${resume.parsedContent.skills.technical.join(', ')}`);
  }

  if (resume.parsedContent?.education) {
    const education = resume.parsedContent.education
      .map(edu => `${edu.degree} from ${edu.institution}`)
      .join('. ');
    parts.push(`Education: ${education}`);
  }

  return parts.join('. ');
};

/**
 * Build content for job embedding
 */
const buildJobEmbeddingContent = (job) => {
  const parts = [];

  parts.push(`Job Title: ${job.title}`);
  parts.push(`Company: ${job.company.name}`);
  parts.push(`Description: ${job.description}`);

  if (job.requirements && job.requirements.length > 0) {
    parts.push(`Requirements: ${job.requirements.join('. ')}`);
  }

  if (job.responsibilities && job.responsibilities.length > 0) {
    parts.push(`Responsibilities: ${job.responsibilities.join('. ')}`);
  }

  if (job.skills && job.skills.length > 0) {
    parts.push(`Required Skills: ${job.skills.join(', ')}`);
  }

  return parts.join('. ');
};

module.exports = {
  getHealthStatus,
  generateTextEmbedding,
  matchResumeToJob,
  getJobRecommendations,
  getCandidateRecommendations,
  analyzeResumeWithAI,
  getResumeSuggestions,
  optimizeResumeForSpecificJob,
  extractSkills,
  optimizeJobDescriptionWithAI,
  bulkGenerateResumeEmbeddings,
  bulkGenerateJobEmbeddings
};
