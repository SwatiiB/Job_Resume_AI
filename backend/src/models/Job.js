const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       required:
 *         - title
 *         - company
 *         - description
 *         - location
 *         - employmentType
 *         - postedBy
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ObjectId
 *         title:
 *           type: string
 *           description: Job title
 *           example: Senior Software Engineer
 *         company:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: Tech Corp Inc.
 *             logo:
 *               type: string
 *               example: https://example.com/logo.png
 *             website:
 *               type: string
 *               example: https://techcorp.com
 *             industry:
 *               type: string
 *               example: Technology
 *             size:
 *               type: string
 *               enum: [1-10, 11-50, 51-200, 201-500, 501-1000, 1000+]
 *         description:
 *           type: string
 *           description: Job description
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: Job requirements
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *           description: Job responsibilities
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Required skills
 *         location:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             isRemote:
 *               type: boolean
 *             workMode:
 *               type: string
 *               enum: [remote, hybrid, onsite]
 *         salary:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             currency:
 *               type: string
 *               default: USD
 *             period:
 *               type: string
 *               enum: [hourly, monthly, yearly]
 *         employmentType:
 *           type: string
 *           enum: [full-time, part-time, contract, internship, freelance]
 *         experienceLevel:
 *           type: string
 *           enum: [entry, mid, senior, lead, executive]
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *         applicationDeadline:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [draft, active, paused, closed, expired]
 *         postedBy:
 *           type: string
 *           description: Recruiter user ID
 *         applications:
 *           type: array
 *           items:
 *             type: object
 *         viewCount:
 *           type: number
 *           default: 0
 *         applicationCount:
 *           type: number
 *           default: 0
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *           default: normal
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  company: {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    logo: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Company logo must be a valid URL'
      }
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Company website must be a valid URL'
      }
    },
    industry: {
      type: String,
      trim: true,
      maxlength: [50, 'Industry cannot exceed 50 characters']
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    description: {
      type: String,
      maxlength: [1000, 'Company description cannot exceed 1000 characters']
    }
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    minlength: [50, 'Job description must be at least 50 characters'],
    maxlength: [5000, 'Job description cannot exceed 5000 characters']
  },
  requirements: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each requirement cannot exceed 500 characters']
  }],
  responsibilities: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each responsibility cannot exceed 500 characters']
  }],
  skills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Each skill cannot exceed 50 characters']
  }],
  location: {
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, 'Country cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [10, 'Zip code cannot exceed 10 characters']
    },
    isRemote: {
      type: Boolean,
      default: false
    },
    workMode: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
      required: [true, 'Work mode is required']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative'],
      validate: {
        validator: function(v) {
          return !this.salary.min || v >= this.salary.min;
        },
        message: 'Maximum salary cannot be less than minimum salary'
      }
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      match: [/^[A-Z]{3}$/, 'Currency must be a 3-letter code']
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    },
    negotiable: {
      type: Boolean,
      default: false
    }
  },
  employmentType: {
    type: String,
    required: [true, 'Employment type is required'],
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance']
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
    default: 'mid'
  },
  educationLevel: {
    type: String,
    enum: ['high-school', 'associate', 'bachelor', 'master', 'phd', 'none'],
    default: 'bachelor'
  },
  benefits: [{
    type: String,
    trim: true,
    maxlength: [100, 'Each benefit cannot exceed 100 characters']
  }],
  applicationDeadline: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > new Date();
      },
      message: 'Application deadline must be in the future'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'expired'],
    default: 'draft'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Posted by user is required']
  },
  applications: [{
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected'],
      default: 'pending'
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume'
    },
    coverLetter: {
      type: String,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    notes: [{
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: {
        type: String,
        maxlength: [1000, 'Note cannot exceed 1000 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    interviews: [{
      type: {
        type: String,
        enum: ['phone', 'video', 'onsite', 'technical', 'behavioral']
      },
      scheduledAt: Date,
      duration: Number, // in minutes
      interviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
      },
      feedback: {
        type: String,
        maxlength: [2000, 'Interview feedback cannot exceed 2000 characters']
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      }
    }]
  }],
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  applicationCount: {
    type: Number,
    default: 0,
    min: [0, 'Application count cannot be negative']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Each tag cannot exceed 30 characters']
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  featured: {
    type: Boolean,
    default: false
  },
  autoClose: {
    enabled: {
      type: Boolean,
      default: false
    },
    maxApplications: {
      type: Number,
      min: [1, 'Max applications must be at least 1']
    },
    deadline: Date
  },
  screening: {
    questions: [{
      question: {
        type: String,
        required: true,
        maxlength: [500, 'Question cannot exceed 500 characters']
      },
      type: {
        type: String,
        enum: ['text', 'multiple-choice', 'yes-no', 'rating'],
        default: 'text'
      },
      required: {
        type: Boolean,
        default: false
      },
      options: [String] // For multiple-choice questions
    }],
    enabled: {
      type: Boolean,
      default: false
    }
  },
  // AI-related fields for job matching
  embedding: [{
    type: Number // Vector embedding for semantic search
  }],
  
  // Embedding metadata
  embeddingMetadata: {
    model: {
      type: String,
      default: 'embedding-001'
    },
    dimensions: {
      type: Number,
      default: 768
    },
    generatedAt: Date,
    version: {
      type: String,
      default: '1.0'
    }
  },
  keywords: [{
    type: String,
    trim: true
  }],
  matchingCriteria: {
    requiredSkills: [{
      skill: String,
      importance: {
        type: String,
        enum: ['nice-to-have', 'preferred', 'required'],
        default: 'preferred'
      }
    }],
    minExperience: {
      type: Number,
      min: 0,
      default: 0
    },
    maxExperience: {
      type: Number,
      min: 0
    },
    educationRequired: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
jobSchema.index({ title: 'text', description: 'text', 'company.name': 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1, status: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ 'location.city': 1 });
jobSchema.index({ 'location.country': 1 });
jobSchema.index({ employmentType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ featured: 1, priority: -1, createdAt: -1 });
jobSchema.index({ tags: 1 });
jobSchema.index({ 'salary.min': 1, 'salary.max': 1 });

// Compound indexes for common queries
jobSchema.index({ status: 1, 'location.workMode': 1, employmentType: 1 });
jobSchema.index({ skills: 1, 'location.city': 1, experienceLevel: 1 });

// Virtual for full location string
jobSchema.virtual('location.fullLocation').get(function() {
  const parts = [];
  if (this.location.city) parts.push(this.location.city);
  if (this.location.state) parts.push(this.location.state);
  if (this.location.country) parts.push(this.location.country);
  return parts.join(', ');
});

// Virtual for salary range string
jobSchema.virtual('salary.range').get(function() {
  if (!this.salary.min && !this.salary.max) return 'Not specified';
  
  const formatSalary = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.salary.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (this.salary.min && this.salary.max) {
    return `${formatSalary(this.salary.min)} - ${formatSalary(this.salary.max)} per ${this.salary.period}`;
  } else if (this.salary.min) {
    return `From ${formatSalary(this.salary.min)} per ${this.salary.period}`;
  } else if (this.salary.max) {
    return `Up to ${formatSalary(this.salary.max)} per ${this.salary.period}`;
  }
});

// Virtual for application statistics
jobSchema.virtual('applicationStats').get(function() {
  if (!this.applications || this.applications.length === 0) {
    return {
      total: 0,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      interviewed: 0,
      hired: 0,
      rejected: 0
    };
  }

  const stats = {
    total: this.applications.length,
    pending: 0,
    reviewing: 0,
    shortlisted: 0,
    interviewed: 0,
    hired: 0,
    rejected: 0
  };

  this.applications.forEach(app => {
    stats[app.status]++;
  });

  return stats;
});

// Virtual for time since posted
jobSchema.virtual('timePosted').get(function() {
  const now = new Date();
  const posted = new Date(this.createdAt);
  const diffTime = Math.abs(now - posted);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

// Virtual for application deadline status
jobSchema.virtual('deadlineStatus').get(function() {
  if (!this.applicationDeadline) return 'no-deadline';
  
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'urgent';
  if (diffDays <= 7) return 'soon';
  return 'normal';
});

// Pre-save middleware to update application count
jobSchema.pre('save', function(next) {
  if (this.isModified('applications')) {
    this.applicationCount = this.applications.length;
  }
  next();
});

// Pre-save middleware to auto-close job if conditions are met
jobSchema.pre('save', function(next) {
  if (this.autoClose.enabled) {
    const shouldClose = 
      (this.autoClose.maxApplications && this.applicationCount >= this.autoClose.maxApplications) ||
      (this.autoClose.deadline && new Date() >= new Date(this.autoClose.deadline));
    
    if (shouldClose && this.status === 'active') {
      this.status = 'closed';
    }
  }
  next();
});

// Pre-save middleware to handle status changes
jobSchema.pre('save', function(next) {
  // Auto-expire jobs past deadline
  if (this.applicationDeadline && new Date() > new Date(this.applicationDeadline) && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Method to check if user can apply
jobSchema.methods.canApply = function(userId) {
  // Check if already applied
  const hasApplied = this.applications.some(app => 
    app.candidate.toString() === userId.toString()
  );
  
  if (hasApplied) return { canApply: false, reason: 'Already applied' };
  
  // Check if job is active
  if (this.status !== 'active') return { canApply: false, reason: 'Job is not active' };
  
  // Check deadline
  if (this.applicationDeadline && new Date() > new Date(this.applicationDeadline)) {
    return { canApply: false, reason: 'Application deadline has passed' };
  }
  
  // Check max applications
  if (this.autoClose.enabled && this.autoClose.maxApplications && 
      this.applicationCount >= this.autoClose.maxApplications) {
    return { canApply: false, reason: 'Maximum applications reached' };
  }
  
  return { canApply: true };
};

// Method to add application
jobSchema.methods.addApplication = function(applicationData) {
  this.applications.push(applicationData);
  this.applicationCount = this.applications.length;
  return this.save();
};

// Method to update application status
jobSchema.methods.updateApplicationStatus = function(candidateId, status, notes = null) {
  const application = this.applications.find(app => 
    app.candidate.toString() === candidateId.toString()
  );
  
  if (!application) {
    throw new Error('Application not found');
  }
  
  application.status = status;
  
  if (notes) {
    application.notes.push(notes);
  }
  
  return this.save();
};

// Method to increment view count
jobSchema.methods.incrementViewCount = function() {
  this.viewCount++;
  return this.save({ validateBeforeSave: false });
};

// Static method to find similar jobs
jobSchema.statics.findSimilar = function(jobId, limit = 5) {
  return this.find({
    _id: { $ne: jobId },
    status: 'active'
  })
  .limit(limit)
  .sort({ createdAt: -1 });
};

// Static method for advanced search
jobSchema.statics.advancedSearch = function(searchParams) {
  const {
    q, // text search
    location,
    skills,
    employmentType,
    experienceLevel,
    salaryMin,
    salaryMax,
    workMode,
    company,
    tags,
    postedWithin, // days
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = searchParams;

  const query = { status: 'active' };
  
  // Text search
  if (q) {
    query.$text = { $search: q };
  }
  
  // Location search
  if (location) {
    query.$or = [
      { 'location.city': { $regex: location, $options: 'i' } },
      { 'location.state': { $regex: location, $options: 'i' } },
      { 'location.country': { $regex: location, $options: 'i' } }
    ];
  }
  
  // Skills search
  if (skills && skills.length > 0) {
    query.skills = { $in: skills.map(skill => new RegExp(skill, 'i')) };
  }
  
  // Employment type
  if (employmentType) {
    query.employmentType = { $in: Array.isArray(employmentType) ? employmentType : [employmentType] };
  }
  
  // Experience level
  if (experienceLevel) {
    query.experienceLevel = { $in: Array.isArray(experienceLevel) ? experienceLevel : [experienceLevel] };
  }
  
  // Salary range
  if (salaryMin || salaryMax) {
    query.$and = query.$and || [];
    if (salaryMin) {
      query.$and.push({
        $or: [
          { 'salary.max': { $gte: salaryMin } },
          { 'salary.max': { $exists: false } }
        ]
      });
    }
    if (salaryMax) {
      query.$and.push({
        $or: [
          { 'salary.min': { $lte: salaryMax } },
          { 'salary.min': { $exists: false } }
        ]
      });
    }
  }
  
  // Work mode
  if (workMode) {
    query['location.workMode'] = { $in: Array.isArray(workMode) ? workMode : [workMode] };
  }
  
  // Company
  if (company) {
    query['company.name'] = { $regex: company, $options: 'i' };
  }
  
  // Tags
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }
  
  // Posted within
  if (postedWithin) {
    const date = new Date();
    date.setDate(date.getDate() - postedWithin);
    query.createdAt = { $gte: date };
  }
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // Add text score sorting if text search is used
  if (q) {
    sort.score = { $meta: 'textScore' };
  }
  
  return this.find(query)
    .populate('postedBy', 'profile.firstName profile.lastName profile.company')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Job', jobSchema);
