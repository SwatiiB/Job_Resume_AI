const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ObjectId
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: Hashed password
 *         role:
 *           type: string
 *           enum: [candidate, recruiter, admin]
 *           description: User role
 *         isVerified:
 *           type: boolean
 *           description: Email verification status
 *         isActive:
 *           type: boolean
 *           description: Account active status
 *         profile:
 *           type: object
 *           description: User profile data
 *         refreshTokens:
 *           type: array
 *           items:
 *             type: string
 *           description: Active refresh tokens
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['candidate', 'recruiter', 'admin'],
    default: 'candidate',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    // Common fields
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
    },
    avatar: {
      type: String, // URL to profile picture
      default: null
    },
    
    // Candidate-specific fields
    skills: [{
      type: String,
      trim: true
    }],
    experience: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      current: Boolean,
      description: String,
      location: String
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      current: Boolean,
      gpa: Number,
      description: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      credentialId: String,
      url: String
    }],
    location: {
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    preferences: {
      jobTypes: [{
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance']
      }],
      workModes: [{
        type: String,
        enum: ['remote', 'hybrid', 'onsite']
      }],
      expectedSalary: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: 'USD'
        }
      },
      willingToRelocate: Boolean,
      availabilityDate: Date
    },
    
    // Recruiter-specific fields
    company: {
      name: String,
      website: String,
      industry: String,
      size: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
      },
      description: String,
      logo: String // URL to company logo
    },
    
    // Profile completion tracking
    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastProfileUpdate: {
      type: Date,
      default: Date.now
    }
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days in seconds
    }
  }],
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  otpCode: String,
  otpExpires: Date,
  otpAttempts: {
    type: Number,
    default: 0
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'profile.skills': 1 });
userSchema.index({ 'profile.location.city': 1 });
userSchema.index({ 'profile.preferences.jobTypes': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || '';
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update profile completion
userSchema.pre('save', function(next) {
  if (this.isModified('profile')) {
    this.profile.profileCompletion = this.calculateProfileCompletion();
    this.profile.lastProfileUpdate = new Date();
  }
  next();
});

// Method to calculate profile completion percentage
userSchema.methods.calculateProfileCompletion = function() {
  if (this.role !== 'candidate') return 100;
  
  let completedFields = 0;
  const totalFields = 15; // Adjust based on required fields
  
  // Basic info (5 fields)
  if (this.profile.firstName) completedFields++;
  if (this.profile.lastName) completedFields++;
  if (this.profile.phone) completedFields++;
  if (this.profile.avatar) completedFields++;
  if (this.profile.location && this.profile.location.city) completedFields++;
  
  // Skills (2 fields)
  if (this.profile.skills && this.profile.skills.length > 0) completedFields++;
  if (this.profile.skills && this.profile.skills.length >= 5) completedFields++;
  
  // Experience (3 fields)
  if (this.profile.experience && this.profile.experience.length > 0) completedFields++;
  if (this.profile.experience && this.profile.experience.length >= 2) completedFields++;
  if (this.profile.experience && this.profile.experience.some(exp => exp.description)) completedFields++;
  
  // Education (2 fields)
  if (this.profile.education && this.profile.education.length > 0) completedFields++;
  if (this.profile.education && this.profile.education.some(edu => edu.description)) completedFields++;
  
  // Preferences (3 fields)
  if (this.profile.preferences && this.profile.preferences.jobTypes && this.profile.preferences.jobTypes.length > 0) completedFields++;
  if (this.profile.preferences && this.profile.preferences.workModes && this.profile.preferences.workModes.length > 0) completedFields++;
  if (this.profile.preferences && this.profile.preferences.expectedSalary && this.profile.preferences.expectedSalary.min) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
};

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
  
  // Add to user's refresh tokens
  this.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date()
  });
  
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return refreshToken;
};

// Method to generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Method to generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
  this.otpCode = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  this.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
  this.otpAttempts = 0;
  
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(otp) {
  if (this.otpAttempts >= 3) {
    throw new Error('Too many OTP attempts. Please request a new OTP.');
  }
  
  if (!this.otpCode || !this.otpExpires) {
    throw new Error('No OTP found. Please request a new OTP.');
  }
  
  if (Date.now() > this.otpExpires) {
    throw new Error('OTP has expired. Please request a new OTP.');
  }
  
  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  if (hashedOTP !== this.otpCode) {
    this.otpAttempts++;
    throw new Error('Invalid OTP.');
  }
  
  // Clear OTP fields after successful verification
  this.otpCode = undefined;
  this.otpExpires = undefined;
  this.otpAttempts = 0;
  
  return true;
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockUntil: 1
      },
      $set: {
        loginAttempts: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

module.exports = mongoose.model('User', userSchema);
