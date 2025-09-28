const Job = require('../models/Job');
const User = require('../models/User');
const Resume = require('../models/Resume');
const logger = require('../utils/logger');

// Import AI services
const { generateEmbedding, findCandidateMatches } = require('../../ai-services');
const { notificationQueue } = require('../../notifications/NotificationQueue');

/**
 * @desc    Create a new job posting
 * @route   POST /api/jobs
 * @access  Private (Recruiter/Admin)
 */
const createJob = async (req, res, next) => {
  try {
    // Add the recruiter's company info if not provided
    if (!req.body.company && req.user.profile.company) {
      req.body.company = req.user.profile.company;
    }

    // Set postedBy to current user
    req.body.postedBy = req.user.id;

    const job = await Job.create(req.body);

    // Generate embedding in background
    generateJobEmbeddingInBackground(job._id);

    // Queue job match notifications for candidates
    queueJobMatchNotifications(job._id);

    logger.info(`Job created: ${job.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job
    });

  } catch (error) {
    logger.error('Create job error:', error);
    next(error);
  }
};

/**
 * @desc    Get all jobs with filtering and pagination
 * @route   GET /api/jobs
 * @access  Public
 */
const getJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = { status: 'active' };

    // Filters
    if (req.query.employmentType) {
      const types = req.query.employmentType.split(',');
      query.employmentType = { $in: types };
    }

    if (req.query.experienceLevel) {
      const levels = req.query.experienceLevel.split(',');
      query.experienceLevel = { $in: levels };
    }

    if (req.query.workMode) {
      const modes = req.query.workMode.split(',');
      query['location.workMode'] = { $in: modes };
    }

    if (req.query.location) {
      query.$or = [
        { 'location.city': { $regex: req.query.location, $options: 'i' } },
        { 'location.state': { $regex: req.query.location, $options: 'i' } },
        { 'location.country': { $regex: req.query.location, $options: 'i' } }
      ];
    }

    if (req.query.company) {
      query['company.name'] = { $regex: req.query.company, $options: 'i' };
    }

    // Salary range
    if (req.query.salaryMin || req.query.salaryMax) {
      query.$and = query.$and || [];
      if (req.query.salaryMin) {
        query.$and.push({
          $or: [
            { 'salary.max': { $gte: parseInt(req.query.salaryMin) } },
            { 'salary.max': { $exists: false } }
          ]
        });
      }
      if (req.query.salaryMax) {
        query.$and.push({
          $or: [
            { 'salary.min': { $lte: parseInt(req.query.salaryMax) } },
            { 'salary.min': { $exists: false } }
          ]
        });
      }
    }

    // Date range
    if (req.query.postedWithin) {
      const days = parseInt(req.query.postedWithin);
      const date = new Date();
      date.setDate(date.getDate() - days);
      query.createdAt = { $gte: date };
    }

    // Sorting
    let sort = {};
    switch (req.query.sortBy) {
      case 'salary':
        sort = { 'salary.min': -1 };
        break;
      case 'company':
        sort = { 'company.name': 1 };
        break;
      case 'title':
        sort = { title: 1 };
        break;
      default:
        sort = { featured: -1, priority: -1, createdAt: -1 };
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'profile.firstName profile.lastName profile.company')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-applications -embedding'); // Exclude sensitive data

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get jobs error:', error);
    next(error);
  }
};

/**
 * @desc    Get job by ID
 * @route   GET /api/jobs/:jobId
 * @access  Public
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate('postedBy', 'profile.firstName profile.lastName profile.company profile.avatar')
      .select('-applications -embedding');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Increment view count (but not for the job owner)
    if (!req.user || req.user.id.toString() !== job.postedBy._id.toString()) {
      await job.incrementViewCount();
    }

    // Check if user has applied (if authenticated)
    let hasApplied = false;
    if (req.user && req.user.role === 'candidate') {
      const fullJob = await Job.findById(req.params.jobId);
      hasApplied = fullJob.applications.some(app => 
        app.candidate.toString() === req.user.id.toString()
      );
    }

    res.status(200).json({
      success: true,
      data: {
        ...job.toObject(),
        hasApplied
      }
    });

  } catch (error) {
    logger.error('Get job by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Update job
 * @route   PUT /api/jobs/:jobId
 * @access  Private (Job Owner/Admin)
 */
const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && job.postedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this job'
      });
    }

    // Update job
    const allowedFields = [
      'title', 'description', 'requirements', 'responsibilities', 'skills',
      'location', 'salary', 'employmentType', 'experienceLevel', 'educationLevel',
      'benefits', 'applicationDeadline', 'status', 'tags', 'priority', 'featured',
      'autoClose', 'screening', 'company'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    await job.save();

    // Regenerate embedding if content changed
    const contentFields = ['title', 'description', 'requirements', 'responsibilities', 'skills'];
    const contentChanged = contentFields.some(field => req.body[field] !== undefined);
    
    if (contentChanged) {
      generateJobEmbeddingInBackground(job._id);
    }

    logger.info(`Job updated: ${job.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job
    });

  } catch (error) {
    logger.error('Update job error:', error);
    next(error);
  }
};

/**
 * @desc    Delete job
 * @route   DELETE /api/jobs/:jobId
 * @access  Private (Job Owner/Admin)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && job.postedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this job'
      });
    }

    await Job.findByIdAndDelete(req.params.jobId);

    logger.info(`Job deleted: ${job.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    logger.error('Delete job error:', error);
    next(error);
  }
};

/**
 * @desc    Apply to a job
 * @route   POST /api/jobs/:jobId/apply
 * @access  Private (Candidate)
 */
const applyToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check if user can apply
    const canApplyResult = job.canApply(req.user.id);
    if (!canApplyResult.canApply) {
      return res.status(400).json({
        success: false,
        error: canApplyResult.reason
      });
    }

    // Create application
    const application = {
      candidate: req.user.id,
      coverLetter: req.body.coverLetter,
      resume: req.body.resumeId,
      appliedAt: new Date()
    };

    // Add AI match score if available (this would be calculated by AI service)
    // application.matchScore = await calculateMatchScore(job, req.user);

    await job.addApplication(application);

    logger.info(`Job application: ${req.user.email} applied to ${job.title}`);

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    logger.error('Apply to job error:', error);
    next(error);
  }
};

/**
 * @desc    Get job applications
 * @route   GET /api/jobs/:jobId/applications
 * @access  Private (Job Owner/Admin)
 */
const getJobApplications = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate({
        path: 'applications.candidate',
        select: 'profile email createdAt'
      })
      .populate({
        path: 'applications.resume',
        select: 'filename originalName uploadedAt'
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && job.postedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view applications for this job'
      });
    }

    // Filter applications by status if specified
    let applications = job.applications;
    if (req.query.status) {
      applications = applications.filter(app => app.status === req.query.status);
    }

    // Sort applications
    applications.sort((a, b) => {
      if (req.query.sortBy === 'matchScore') {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      return new Date(b.appliedAt) - new Date(a.appliedAt);
    });

    res.status(200).json({
      success: true,
      data: {
        job: {
          id: job._id,
          title: job.title,
          company: job.company
        },
        applications,
        stats: job.applicationStats
      }
    });

  } catch (error) {
    logger.error('Get job applications error:', error);
    next(error);
  }
};

/**
 * @desc    Update application status
 * @route   PUT /api/jobs/:jobId/applications/:candidateId/status
 * @access  Private (Job Owner/Admin)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && job.postedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update applications for this job'
      });
    }

    const noteData = note ? {
      author: req.user.id,
      content: note,
      createdAt: new Date()
    } : null;

    await job.updateApplicationStatus(req.params.candidateId, status, noteData);

    logger.info(`Application status updated: ${req.params.candidateId} to ${status} for job ${job.title}`);

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully'
    });

  } catch (error) {
    logger.error('Update application status error:', error);
    next(error);
  }
};

/**
 * @desc    Advanced job search
 * @route   GET /api/jobs/search
 * @access  Public
 */
const searchJobs = async (req, res, next) => {
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

    // Parse employment types if provided
    if (req.query.employmentType) {
      searchParams.employmentType = req.query.employmentType.split(',');
    }

    // Parse experience levels if provided
    if (req.query.experienceLevel) {
      searchParams.experienceLevel = req.query.experienceLevel.split(',');
    }

    // Parse work modes if provided
    if (req.query.workMode) {
      searchParams.workMode = req.query.workMode.split(',');
    }

    const jobs = await Job.advancedSearch(searchParams);
    const total = await Job.countDocuments(jobs.getQuery ? jobs.getQuery() : {});

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: searchParams.page,
        limit: searchParams.limit,
        total,
        pages: Math.ceil(total / searchParams.limit)
      },
      searchParams
    });

  } catch (error) {
    logger.error('Search jobs error:', error);
    next(error);
  }
};

/**
 * @desc    Get jobs posted by current recruiter
 * @route   GET /api/jobs/my-jobs
 * @access  Private (Recruiter/Admin)
 */
const getMyJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { postedBy: req.user.id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-embedding');

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get my jobs error:', error);
    next(error);
  }
};

/**
 * @desc    Get jobs applied to by current candidate
 * @route   GET /api/jobs/my-applications
 * @access  Private (Candidate)
 */
const getMyApplications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      'applications.candidate': req.user.id
    };

    if (req.query.status) {
      query['applications.status'] = req.query.status;
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'profile.firstName profile.lastName profile.company')
      .sort({ 'applications.appliedAt': -1 })
      .skip(skip)
      .limit(limit);

    // Filter and format the applications
    const applications = jobs.map(job => {
      const application = job.applications.find(app => 
        app.candidate.toString() === req.user.id.toString()
      );
      
      return {
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          employmentType: job.employmentType,
          postedBy: job.postedBy
        },
        application: {
          status: application.status,
          appliedAt: application.appliedAt,
          coverLetter: application.coverLetter,
          matchScore: application.matchScore
        }
      };
    });

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get my applications error:', error);
    next(error);
  }
};

/**
 * @desc    Get featured jobs
 * @route   GET /api/jobs/featured
 * @access  Public
 */
const getFeaturedJobs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const jobs = await Job.find({ 
      status: 'active',
      featured: true
    })
    .populate('postedBy', 'profile.firstName profile.lastName profile.company')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .select('-applications -embedding');

    res.status(200).json({
      success: true,
      data: jobs
    });

  } catch (error) {
    logger.error('Get featured jobs error:', error);
    next(error);
  }
};

/**
 * @desc    Get job statistics
 * @route   GET /api/jobs/:jobId/stats
 * @access  Private (Job Owner/Admin)
 */
const getJobStats = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && job.postedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view statistics for this job'
      });
    }

    const stats = {
      viewCount: job.viewCount,
      applicationStats: job.applicationStats,
      timePosted: job.timePosted,
      deadlineStatus: job.deadlineStatus,
      performance: {
        viewsPerDay: job.viewCount / Math.max(1, Math.floor((new Date() - job.createdAt) / (1000 * 60 * 60 * 24))),
        applicationsPerDay: job.applicationCount / Math.max(1, Math.floor((new Date() - job.createdAt) / (1000 * 60 * 60 * 24))),
        conversionRate: job.viewCount > 0 ? (job.applicationCount / job.viewCount * 100).toFixed(2) : 0
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Get job stats error:', error);
    next(error);
  }
};

/**
 * Background function to generate job embeddings
 */
const generateJobEmbeddingInBackground = async (jobId) => {
  try {
    const job = await Job.findById(jobId);
    if (!job) return;

    // Build content for embedding
    const content = buildJobEmbeddingContent(job);
    
    // Generate embedding
    const embedding = await generateEmbedding(content);
    
    // Update job with embedding
    job.embedding = embedding;
    job.embeddingMetadata = {
      model: 'embedding-001',
      dimensions: embedding.length,
      generatedAt: new Date(),
      version: '1.0'
    };
    
    await job.save({ validateBeforeSave: false });

    logger.info(`Generated embedding for job: ${job.title}`);

  } catch (error) {
    logger.error(`Embedding generation failed for job ${jobId}:`, error);
  }
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

/**
 * Queue job match notifications for candidates
 */
const queueJobMatchNotifications = async (jobId) => {
  try {
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') return;

    // Find candidates with active resumes
    const resumes = await Resume.find({
      isActive: true,
      embedding: { $exists: true }
    }).populate('userId', 'profile email').limit(500);

    if (resumes.length === 0) return;

    // Find matches
    const matches = await findCandidateMatches(job, resumes, 50);
    const threshold = parseInt(process.env.JOB_MATCH_THRESHOLD) || 50;

    let notificationsQueued = 0;

    for (const match of matches.matches) {
      if (match.overallScore >= threshold) {
        const candidate = match.candidate;
        
        // Check user notification preferences
        const user = await User.findById(candidate.id);
        if (user && user.profile.preferences?.notifications?.job_match !== false) {
          await notificationQueue.queueJobMatchNotification(
            candidate.id,
            user.email,
            user.profile.fullName || user.email,
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

          notificationsQueued++;
        }
      }
    }

    logger.info(`Queued ${notificationsQueued} job match notifications for job: ${job.title}`);

  } catch (error) {
    logger.error(`Failed to queue job match notifications for job ${jobId}:`, error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
  searchJobs,
  getMyJobs,
  getMyApplications,
  getFeaturedJobs,
  getJobStats
};
