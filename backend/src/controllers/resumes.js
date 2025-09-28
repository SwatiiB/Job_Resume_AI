const Resume = require('../models/Resume');
const User = require('../models/User');
const logger = require('../utils/logger');
const { deleteFile, getFileUrl } = require('../middleware/upload');
const path = require('path');
const fs = require('fs').promises;

// Import resume parsing services
const { parseResumeContent } = require('../services/resumeParsingService');
const { analyzeATSCompatibility } = require('../services/atsAnalysisService');
const { generateAISuggestions } = require('../services/aiSuggestionsService');
const { exportResumeToFormat } = require('../services/resumeExportService');

// Import AI services
const { generateEmbedding } = require('../../ai-services');

/**
 * @desc    Upload a new resume
 * @route   POST /api/resumes
 * @access  Private
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Create resume record
    const resumeData = {
      userId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: req.file.path,
      downloadUrl: getFileUrl(req.file.filename, 'resumes'),
      tags: req.body.tags || []
    };

    const resume = await Resume.create(resumeData);

    // Start background parsing
    parseResumeInBackground(resume._id);

    logger.info(`Resume uploaded: ${resume.originalName} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully. Parsing in progress...',
      resume: {
        id: resume._id,
        filename: resume.filename,
        originalName: resume.originalName,
        fileSize: resume.fileSize,
        downloadUrl: resume.downloadUrl,
        parsingStatus: resume.parsedContent?.parsingStatus || 'pending',
        createdAt: resume.createdAt
      }
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      deleteFile(req.file.path);
    }
    logger.error('Upload resume error:', error);
    next(error);
  }
};

/**
 * @desc    Get user's resumes
 * @route   GET /api/resumes
 * @access  Private
 */
const getMyResumes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const includeInactive = req.query.includeInactive === 'true';

    const query = { userId: req.user.id };
    if (!includeInactive) {
      query.isActive = true;
    }

    const resumes = await Resume.find(query)
      .sort({ isActive: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-parsedContent.rawText -embedding'); // Exclude large fields

    const total = await Resume.countDocuments(query);

    res.status(200).json({
      success: true,
      data: resumes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get my resumes error:', error);
    next(error);
  }
};

/**
 * @desc    Get resume by ID
 * @route   GET /api/resumes/:resumeId
 * @access  Private (Owner or Admin/Recruiter)
 */
const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.resumeId)
      .populate('userId', 'profile email');

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check access permissions
    const canAccess = 
      req.user.id.toString() === resume.userId._id.toString() ||
      req.user.role === 'admin' ||
      req.user.role === 'recruiter';

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Increment view count if not owner
    if (req.user.id.toString() !== resume.userId._id.toString()) {
      await resume.incrementViewCount();
    }

    res.status(200).json({
      success: true,
      data: resume
    });

  } catch (error) {
    logger.error('Get resume by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Update resume metadata
 * @route   PUT /api/resumes/:resumeId
 * @access  Private (Owner only)
 */
const updateResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check ownership
    if (resume.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update allowed fields
    const allowedFields = ['tags', 'isActive'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        resume[field] = req.body[field];
      }
    });

    await resume.save();

    logger.info(`Resume updated: ${resume.originalName} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Resume updated successfully',
      resume
    });

  } catch (error) {
    logger.error('Update resume error:', error);
    next(error);
  }
};

/**
 * @desc    Delete resume
 * @route   DELETE /api/resumes/:resumeId
 * @access  Private (Owner only)
 */
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check ownership
    if (resume.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Delete file from storage
    deleteFile(resume.filePath);

    // Delete from database
    await Resume.findByIdAndDelete(req.params.resumeId);

    logger.info(`Resume deleted: ${resume.originalName} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    logger.error('Delete resume error:', error);
    next(error);
  }
};

/**
 * @desc    Download resume file
 * @route   GET /api/resumes/:resumeId/download
 * @access  Private (Owner or Admin/Recruiter)
 */
const downloadResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check access permissions
    const canAccess = 
      req.user.id.toString() === resume.userId.toString() ||
      req.user.role === 'admin' ||
      req.user.role === 'recruiter';

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if file exists
    try {
      await fs.access(resume.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Resume file not found'
      });
    }

    // Increment download count
    await resume.incrementDownloadCount();

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${resume.originalName}"`);
    res.setHeader('Content-Type', resume.mimeType);

    // Send file
    res.sendFile(path.resolve(resume.filePath));

    logger.info(`Resume downloaded: ${resume.originalName} by ${req.user.email}`);

  } catch (error) {
    logger.error('Download resume error:', error);
    next(error);
  }
};

/**
 * @desc    Parse resume content
 * @route   POST /api/resumes/:resumeId/parse
 * @access  Private (Owner only)
 */
const parseResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check ownership
    if (resume.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Start parsing
    parseResumeInBackground(resume._id);

    res.status(200).json({
      success: true,
      message: 'Resume parsing initiated'
    });

  } catch (error) {
    logger.error('Parse resume error:', error);
    next(error);
  }
};

/**
 * @desc    Get resume analysis and ATS score
 * @route   GET /api/resumes/:resumeId/analysis
 * @access  Private (Owner or Admin/Recruiter)
 */
const getResumeAnalysis = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check access permissions
    const canAccess = 
      req.user.id.toString() === resume.userId.toString() ||
      req.user.role === 'admin' ||
      req.user.role === 'recruiter';

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const analysis = {
      atsScore: resume.atsScore,
      atsGrade: resume.atsGrade,
      atsAnalysis: resume.atsAnalysis,
      extractedSkills: resume.extractedSkills,
      skillsSummary: resume.getSkillsSummary(),
      suggestionSummary: resume.suggestionSummary,
      parsingStatus: resume.parsedContent?.parsingStatus,
      lastAnalyzed: resume.atsAnalysis?.analyzedAt
    };

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Get resume analysis error:', error);
    next(error);
  }
};

/**
 * @desc    Get AI suggestions for resume improvement
 * @route   GET /api/resumes/:resumeId/suggestions
 * @access  Private (Owner only)
 */
const getAISuggestions = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check ownership
    if (resume.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const suggestions = resume.aiSuggestions || [];
    const summary = resume.suggestionSummary;

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        summary
      }
    });

  } catch (error) {
    logger.error('Get AI suggestions error:', error);
    next(error);
  }
};

/**
 * @desc    Apply AI suggestion
 * @route   POST /api/resumes/:resumeId/suggestions/:suggestionId/apply
 * @access  Private (Owner only)
 */
const applySuggestion = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check ownership
    if (resume.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await resume.applySuggestion(req.params.suggestionId);

    logger.info(`Suggestion applied for resume: ${resume.originalName} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Suggestion applied successfully'
    });

  } catch (error) {
    logger.error('Apply suggestion error:', error);
    next(error);
  }
};

/**
 * @desc    Export resume in different formats
 * @route   POST /api/resumes/:resumeId/export
 * @access  Private (Owner or Admin/Recruiter)
 */
const exportResume = async (req, res, next) => {
  try {
    const { format, purpose, jobId } = req.body;
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check access permissions
    const canAccess = 
      req.user.id.toString() === resume.userId.toString() ||
      req.user.role === 'admin' ||
      req.user.role === 'recruiter';

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Export resume
    const exportResult = await exportResumeToFormat(resume, format);

    // Add export record
    await resume.addExportRecord(format, req.user.id, purpose, jobId);

    logger.info(`Resume exported: ${resume.originalName} to ${format} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Resume exported successfully',
      data: exportResult
    });

  } catch (error) {
    logger.error('Export resume error:', error);
    next(error);
  }
};

/**
 * @desc    Search resumes (Admin/Recruiter)
 * @route   GET /api/resumes/search
 * @access  Private (Admin/Recruiter)
 */
const searchResumes = async (req, res, next) => {
  try {
    const searchParams = {
      ...req.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    // Parse skills if provided
    if (req.query.skills) {
      searchParams.skills = req.query.skills.split(',').map(skill => skill.trim());
    }

    // Parse tags if provided
    if (req.query.tags) {
      searchParams.tags = req.query.tags.split(',').map(tag => tag.trim());
    }

    const resumes = await Resume.searchResumes(searchParams);
    const total = await Resume.countDocuments(resumes.getQuery ? resumes.getQuery() : {});

    res.status(200).json({
      success: true,
      data: resumes,
      pagination: {
        page: searchParams.page,
        limit: searchParams.limit,
        total,
        pages: Math.ceil(total / searchParams.limit)
      }
    });

  } catch (error) {
    logger.error('Search resumes error:', error);
    next(error);
  }
};

/**
 * @desc    Set resume as active
 * @route   POST /api/resumes/:resumeId/set-active
 * @access  Private (Owner only)
 */
const setActiveResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Check ownership
    if (resume.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    resume.isActive = true;
    await resume.save();

    logger.info(`Resume set as active: ${resume.originalName} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Resume set as active successfully'
    });

  } catch (error) {
    logger.error('Set active resume error:', error);
    next(error);
  }
};

/**
 * @desc    Get resume versions for a user
 * @route   GET /api/resumes/versions/:userId
 * @access  Private (Owner or Admin)
 */
const getResumeVersions = async (req, res, next) => {
  try {
    const versions = await Resume.getUserVersions(req.params.userId);

    res.status(200).json({
      success: true,
      data: versions
    });

  } catch (error) {
    logger.error('Get resume versions error:', error);
    next(error);
  }
};

/**
 * @desc    Compare two resumes
 * @route   GET /api/resumes/compare/:resumeId1/:resumeId2
 * @access  Private (Owner or Admin)
 */
const compareResumes = async (req, res, next) => {
  try {
    const [resume1, resume2] = await Promise.all([
      Resume.findById(req.params.resumeId1),
      Resume.findById(req.params.resumeId2)
    ]);

    if (!resume1 || !resume2) {
      return res.status(404).json({
        success: false,
        error: 'One or both resumes not found'
      });
    }

    // Check access permissions
    const canAccess1 = 
      req.user.id.toString() === resume1.userId.toString() ||
      req.user.role === 'admin';
    
    const canAccess2 = 
      req.user.id.toString() === resume2.userId.toString() ||
      req.user.role === 'admin';

    if (!canAccess1 || !canAccess2) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const comparison = {
      resume1: {
        id: resume1._id,
        name: resume1.originalName,
        atsScore: resume1.atsScore,
        version: resume1.version,
        skillsCount: resume1.extractedSkills?.length || 0,
        createdAt: resume1.createdAt
      },
      resume2: {
        id: resume2._id,
        name: resume2.originalName,
        atsScore: resume2.atsScore,
        version: resume2.version,
        skillsCount: resume2.extractedSkills?.length || 0,
        createdAt: resume2.createdAt
      },
      differences: {
        atsScoreDiff: resume2.atsScore - resume1.atsScore,
        skillsDiff: (resume2.extractedSkills?.length || 0) - (resume1.extractedSkills?.length || 0),
        versionDiff: resume2.version - resume1.version
      }
    };

    res.status(200).json({
      success: true,
      data: comparison
    });

  } catch (error) {
    logger.error('Compare resumes error:', error);
    next(error);
  }
};

/**
 * Background function to parse resume content
 */
const parseResumeInBackground = async (resumeId) => {
  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) return;

    // Update parsing status
    resume.parsedContent = resume.parsedContent || {};
    resume.parsedContent.parsingStatus = 'processing';
    await resume.save({ validateBeforeSave: false });

    // Parse resume content
    const parsedContent = await parseResumeContent(resume.filePath, resume.mimeType);
    
    // Update resume with parsed content
    resume.parsedContent = {
      ...parsedContent,
      parsingStatus: 'completed',
      parsedAt: new Date(),
      parsingVersion: '1.0'
    };

    // Extract keywords
    resume.keywords = extractKeywords(parsedContent);
    
    // Extract skills
    resume.extractedSkills = extractSkills(parsedContent);

    await resume.save({ validateBeforeSave: false });

    // Generate embedding
    await generateEmbeddingInBackground(resumeId);

    // Start ATS analysis
    analyzeATSInBackground(resumeId);

    logger.info(`Resume parsing completed: ${resume.originalName}`);

  } catch (error) {
    logger.error(`Resume parsing failed for ${resumeId}:`, error);
    
    // Update parsing status to failed
    const resume = await Resume.findById(resumeId);
    if (resume) {
      resume.parsedContent = resume.parsedContent || {};
      resume.parsedContent.parsingStatus = 'failed';
      resume.parsedContent.parsingError = error.message;
      await resume.save({ validateBeforeSave: false });
    }
  }
};

/**
 * Background function to analyze ATS compatibility
 */
const analyzeATSInBackground = async (resumeId) => {
  try {
    const resume = await Resume.findById(resumeId);
    if (!resume || !resume.isParsingComplete) return;

    // Analyze ATS compatibility
    const atsAnalysis = await analyzeATSCompatibility(resume);
    
    // Update resume with ATS analysis
    resume.atsScore = atsAnalysis.score;
    resume.atsAnalysis = {
      ...atsAnalysis,
      analyzedAt: new Date(),
      analysisVersion: '1.0'
    };

    await resume.save({ validateBeforeSave: false });

    // Generate AI suggestions
    generateSuggestionsInBackground(resumeId);

    logger.info(`ATS analysis completed for resume: ${resume.originalName}`);

  } catch (error) {
    logger.error(`ATS analysis failed for ${resumeId}:`, error);
  }
};

/**
 * Background function to generate AI suggestions
 */
const generateSuggestionsInBackground = async (resumeId) => {
  try {
    const resume = await Resume.findById(resumeId);
    if (!resume || !resume.isParsingComplete) return;

    // Generate AI suggestions
    const suggestions = await generateAISuggestions(resume);
    
    // Update resume with suggestions
    resume.aiSuggestions = suggestions;
    await resume.save({ validateBeforeSave: false });

    logger.info(`AI suggestions generated for resume: ${resume.originalName}`);

  } catch (error) {
    logger.error(`AI suggestions generation failed for ${resumeId}:`, error);
  }
};

/**
 * Extract keywords from parsed content
 */
const extractKeywords = (parsedContent) => {
  const keywords = new Set();
  
  // Extract from various sections
  if (parsedContent.personalInfo?.summary) {
    const summaryWords = parsedContent.personalInfo.summary
      .toLowerCase()
      .match(/\b\w{3,}\b/g) || [];
    summaryWords.forEach(word => keywords.add(word));
  }

  if (parsedContent.skills?.technical) {
    parsedContent.skills.technical.forEach(skill => 
      keywords.add(skill.toLowerCase())
    );
  }

  if (parsedContent.experience) {
    parsedContent.experience.forEach(exp => {
      if (exp.description) {
        const expWords = exp.description
          .toLowerCase()
          .match(/\b\w{3,}\b/g) || [];
        expWords.forEach(word => keywords.add(word));
      }
    });
  }

  return Array.from(keywords).slice(0, 100); // Limit to 100 keywords
};

/**
 * Extract skills from parsed content
 */
const extractSkills = (parsedContent) => {
  const skills = [];
  
  // Technical skills
  if (parsedContent.skills?.technical) {
    parsedContent.skills.technical.forEach(skill => {
      skills.push({
        skill: skill,
        confidence: 0.9,
        context: 'skills_section',
        category: 'technical'
      });
    });
  }

  // Skills from experience descriptions
  if (parsedContent.experience) {
    parsedContent.experience.forEach(exp => {
      if (exp.technologies) {
        exp.technologies.forEach(tech => {
          skills.push({
            skill: tech,
            confidence: 0.8,
            context: 'experience',
            category: 'technical'
          });
        });
      }
    });
  }

  return skills;
};

/**
 * Background function to generate embeddings
 */
const generateEmbeddingInBackground = async (resumeId) => {
  try {
    const resume = await Resume.findById(resumeId);
    if (!resume || !resume.parsedContent?.rawText) return;

    // Build content for embedding
    const content = buildResumeEmbeddingContent(resume);
    
    // Generate embedding
    const embedding = await generateEmbedding(content);
    
    // Update resume with embedding
    resume.embedding = embedding;
    resume.embeddingMetadata = {
      model: 'embedding-001',
      dimensions: embedding.length,
      generatedAt: new Date(),
      version: '1.0'
    };
    
    await resume.save({ validateBeforeSave: false });

    logger.info(`Generated embedding for resume: ${resume.originalName}`);

  } catch (error) {
    logger.error(`Embedding generation failed for ${resumeId}:`, error);
  }
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

module.exports = {
  uploadResume,
  getMyResumes,
  getResumeById,
  updateResume,
  deleteResume,
  downloadResume,
  parseResume,
  getResumeAnalysis,
  getAISuggestions,
  applySuggestion,
  exportResume,
  searchResumes,
  setActiveResume,
  getResumeVersions,
  compareResumes
};
