const mongoose = require('mongoose');
const path = require('path');

/**
 * @swagger
 * components:
 *   schemas:
 *     Resume:
 *       type: object
 *       required:
 *         - userId
 *         - filename
 *         - originalName
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ObjectId
 *         userId:
 *           type: string
 *           description: Owner user ID
 *         filename:
 *           type: string
 *           description: Stored filename
 *         originalName:
 *           type: string
 *           description: Original uploaded filename
 *         fileSize:
 *           type: number
 *           description: File size in bytes
 *         mimeType:
 *           type: string
 *           description: MIME type of the file
 *         filePath:
 *           type: string
 *           description: File storage path
 *         downloadUrl:
 *           type: string
 *           description: Download URL
 *         parsedContent:
 *           type: object
 *           description: Parsed resume content
 *         atsScore:
 *           type: number
 *           description: ATS compatibility score (0-100)
 *         aiSuggestions:
 *           type: array
 *           items:
 *             type: object
 *           description: AI-generated improvement suggestions
 *         embedding:
 *           type: array
 *           items:
 *             type: number
 *           description: Vector embedding for semantic matching
 *         keywords:
 *           type: array
 *           items:
 *             type: string
 *           description: Extracted keywords
 *         isActive:
 *           type: boolean
 *           description: Whether this is the active resume
 *         version:
 *           type: number
 *           description: Resume version number
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: User-defined tags
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
    maxlength: [255, 'Original filename cannot exceed 255 characters']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    enum: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  downloadUrl: {
    type: String,
    required: [true, 'Download URL is required']
  },
  
  // Parsed content structure
  parsedContent: {
    // Basic information
    personalInfo: {
      name: String,
      email: String,
      phone: String,
      address: String,
      linkedin: String,
      github: String,
      website: String,
      summary: String
    },
    
    // Professional experience
    experience: [{
      company: String,
      position: String,
      startDate: String,
      endDate: String,
      current: Boolean,
      location: String,
      description: String,
      achievements: [String],
      technologies: [String]
    }],
    
    // Education
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: String,
      endDate: String,
      current: Boolean,
      gpa: String,
      location: String,
      description: String,
      achievements: [String]
    }],
    
    // Skills
    skills: {
      technical: [String],
      soft: [String],
      languages: [{
        language: String,
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'native']
        }
      }],
      certifications: [{
        name: String,
        issuer: String,
        date: String,
        expiryDate: String,
        credentialId: String
      }]
    },
    
    // Projects
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String,
      github: String,
      startDate: String,
      endDate: String,
      achievements: [String]
    }],
    
    // Additional sections
    awards: [{
      title: String,
      issuer: String,
      date: String,
      description: String
    }],
    
    publications: [{
      title: String,
      publisher: String,
      date: String,
      url: String,
      description: String
    }],
    
    volunteering: [{
      organization: String,
      role: String,
      startDate: String,
      endDate: String,
      current: Boolean,
      description: String
    }],
    
    // Raw extracted text
    rawText: String,
    
    // Parsing metadata
    parsingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    parsingError: String,
    parsedAt: Date,
    parsingVersion: {
      type: String,
      default: '1.0'
    }
  },
  
  // ATS compatibility analysis
  atsScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  atsAnalysis: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    factors: {
      formatting: {
        score: Number,
        issues: [String],
        suggestions: [String]
      },
      keywords: {
        score: Number,
        found: [String],
        missing: [String],
        suggestions: [String]
      },
      structure: {
        score: Number,
        issues: [String],
        suggestions: [String]
      },
      readability: {
        score: Number,
        issues: [String],
        suggestions: [String]
      }
    },
    analyzedAt: Date,
    analysisVersion: {
      type: String,
      default: '1.0'
    }
  },
  
  // AI-generated suggestions
  aiSuggestions: [{
    type: {
      type: String,
      enum: ['content', 'formatting', 'keywords', 'structure', 'grammar'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Suggestion title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: true,
      maxlength: [1000, 'Suggestion description cannot exceed 1000 characters']
    },
    section: String, // Which section this suggestion applies to
    currentText: String, // Current problematic text
    suggestedText: String, // Suggested replacement text
    impact: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    category: String, // e.g., 'action-verbs', 'quantification', 'keywords'
    applied: {
      type: Boolean,
      default: false
    },
    appliedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Vector embedding for semantic matching
  embedding: [{
    type: Number
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
  
  // Extracted keywords and phrases
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Skills extracted from resume
  extractedSkills: [{
    skill: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    context: String, // Where the skill was found
    category: {
      type: String,
      enum: ['technical', 'soft', 'language', 'tool', 'framework', 'certification']
    }
  }],
  
  // Resume metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Each tag cannot exceed 30 characters']
  }],
  
  // Usage tracking
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  lastDownloaded: Date,
  lastViewed: Date,
  
  // Job matching history
  matchHistory: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    matchedAt: {
      type: Date,
      default: Date.now
    },
    matchDetails: {
      skillsMatch: Number,
      experienceMatch: Number,
      educationMatch: Number,
      keywordsMatch: Number
    }
  }],
  
  // Export history
  exports: [{
    format: {
      type: String,
      enum: ['pdf', 'docx', 'txt', 'json'],
      required: true
    },
    exportedAt: {
      type: Date,
      default: Date.now
    },
    exportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    purpose: String, // e.g., 'job-application', 'profile-update'
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
resumeSchema.index({ userId: 1, isActive: 1 });
resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ keywords: 1 });
resumeSchema.index({ 'extractedSkills.skill': 1 });
resumeSchema.index({ atsScore: -1 });
resumeSchema.index({ 'parsedContent.parsingStatus': 1 });
resumeSchema.index({ mimeType: 1 });
resumeSchema.index({ tags: 1 });

// Compound indexes
resumeSchema.index({ userId: 1, version: -1 });
resumeSchema.index({ userId: 1, isActive: 1, createdAt: -1 });

// Virtual for file extension
resumeSchema.virtual('fileExtension').get(function() {
  return path.extname(this.originalName).toLowerCase();
});

// Virtual for formatted file size
resumeSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for parsing completion status
resumeSchema.virtual('isParsingComplete').get(function() {
  return this.parsedContent && this.parsedContent.parsingStatus === 'completed';
});

// Virtual for ATS grade
resumeSchema.virtual('atsGrade').get(function() {
  const score = this.atsScore;
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'C+';
  if (score >= 65) return 'C';
  if (score >= 60) return 'D+';
  if (score >= 55) return 'D';
  return 'F';
});

// Virtual for suggestion summary
resumeSchema.virtual('suggestionSummary').get(function() {
  if (!this.aiSuggestions || this.aiSuggestions.length === 0) {
    return { total: 0, byPriority: {}, byType: {} };
  }
  
  const summary = {
    total: this.aiSuggestions.length,
    applied: this.aiSuggestions.filter(s => s.applied).length,
    byPriority: {},
    byType: {}
  };
  
  this.aiSuggestions.forEach(suggestion => {
    // Count by priority
    summary.byPriority[suggestion.priority] = (summary.byPriority[suggestion.priority] || 0) + 1;
    
    // Count by type
    summary.byType[suggestion.type] = (summary.byType[suggestion.type] || 0) + 1;
  });
  
  return summary;
});

// Pre-save middleware to set version
resumeSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Find the highest version for this user
    const highestVersion = await this.constructor.findOne(
      { userId: this.userId },
      { version: 1 },
      { sort: { version: -1 } }
    );
    
    this.version = highestVersion ? highestVersion.version + 1 : 1;
  }
  next();
});

// Pre-save middleware to manage active resume
resumeSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    // Deactivate other resumes for this user
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

// Method to increment download count
resumeSchema.methods.incrementDownloadCount = function() {
  this.downloadCount++;
  this.lastDownloaded = new Date();
  return this.save({ validateBeforeSave: false });
};

// Method to increment view count
resumeSchema.methods.incrementViewCount = function() {
  this.viewCount++;
  this.lastViewed = new Date();
  return this.save({ validateBeforeSave: false });
};

// Method to add match history
resumeSchema.methods.addMatchHistory = function(jobId, matchScore, matchDetails) {
  this.matchHistory.push({
    jobId,
    matchScore,
    matchDetails,
    matchedAt: new Date()
  });
  
  // Keep only last 100 matches
  if (this.matchHistory.length > 100) {
    this.matchHistory = this.matchHistory.slice(-100);
  }
  
  return this.save({ validateBeforeSave: false });
};

// Method to add export record
resumeSchema.methods.addExportRecord = function(format, exportedBy, purpose, jobId) {
  this.exports.push({
    format,
    exportedBy,
    purpose,
    jobId,
    exportedAt: new Date()
  });
  
  // Keep only last 50 exports
  if (this.exports.length > 50) {
    this.exports = this.exports.slice(-50);
  }
  
  return this.save({ validateBeforeSave: false });
};

// Method to apply AI suggestion
resumeSchema.methods.applySuggestion = function(suggestionId) {
  const suggestion = this.aiSuggestions.id(suggestionId);
  if (suggestion) {
    suggestion.applied = true;
    suggestion.appliedAt = new Date();
    return this.save();
  }
  throw new Error('Suggestion not found');
};

// Method to get skills summary
resumeSchema.methods.getSkillsSummary = function() {
  if (!this.extractedSkills || this.extractedSkills.length === 0) {
    return { total: 0, byCategory: {}, topSkills: [] };
  }
  
  const summary = {
    total: this.extractedSkills.length,
    byCategory: {},
    topSkills: []
  };
  
  // Group by category
  this.extractedSkills.forEach(skillObj => {
    const category = skillObj.category || 'other';
    if (!summary.byCategory[category]) {
      summary.byCategory[category] = [];
    }
    summary.byCategory[category].push(skillObj);
  });
  
  // Get top skills by confidence
  summary.topSkills = this.extractedSkills
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, 10)
    .map(skillObj => ({
      skill: skillObj.skill,
      confidence: skillObj.confidence,
      category: skillObj.category
    }));
  
  return summary;
};

// Static method to find resumes by skills
resumeSchema.statics.findBySkills = function(skills, limit = 10) {
  return this.find({
    'extractedSkills.skill': { $in: skills.map(skill => new RegExp(skill, 'i')) },
    isActive: true
  })
  .populate('userId', 'profile email')
  .limit(limit)
  .sort({ atsScore: -1, createdAt: -1 });
};

// Static method to get user's resume versions
resumeSchema.statics.getUserVersions = function(userId) {
  return this.find({ userId })
    .sort({ version: -1 })
    .select('version filename originalName createdAt isActive atsScore');
};

// Static method to search resumes
resumeSchema.statics.searchResumes = function(searchParams) {
  const {
    q,
    skills,
    userId,
    minAtsScore,
    tags,
    page = 1,
    limit = 10
  } = searchParams;
  
  const query = {};
  
  if (userId) {
    query.userId = userId;
  }
  
  if (q) {
    query.$or = [
      { 'parsedContent.rawText': { $regex: q, $options: 'i' } },
      { keywords: { $in: [new RegExp(q, 'i')] } },
      { originalName: { $regex: q, $options: 'i' } }
    ];
  }
  
  if (skills && skills.length > 0) {
    query['extractedSkills.skill'] = { $in: skills.map(skill => new RegExp(skill, 'i')) };
  }
  
  if (minAtsScore) {
    query.atsScore = { $gte: minAtsScore };
  }
  
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('userId', 'profile email')
    .sort({ atsScore: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Resume', resumeSchema);
