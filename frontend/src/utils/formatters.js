/**
 * Utility functions for formatting data in the frontend
 */

/**
 * Format currency amount
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount) return 'Not specified';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format salary range
 */
export const formatSalaryRange = (salary) => {
  if (!salary) return 'Not specified';
  
  const { min, max, currency = 'USD', period = 'yearly' } = salary;
  
  if (min && max) {
    return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)} per ${period}`;
  } else if (min) {
    return `From ${formatCurrency(min, currency)} per ${period}`;
  } else if (max) {
    return `Up to ${formatCurrency(max, currency)} per ${period}`;
  }
  
  return 'Not specified';
};

/**
 * Format date to relative time
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diffTime = Math.abs(now - target);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format percentage with color coding
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Get match score color class
 */
export const getMatchScoreColor = (score) => {
  if (score >= 80) return 'text-success-600 bg-success-50 border-success-200';
  if (score >= 60) return 'text-primary-600 bg-primary-50 border-primary-200';
  if (score >= 40) return 'text-warning-600 bg-warning-50 border-warning-200';
  return 'text-error-600 bg-error-50 border-error-200';
};

/**
 * Get ATS score grade
 */
export const getATSGrade = (score) => {
  if (score >= 90) return { grade: 'A+', color: 'text-success-600' };
  if (score >= 85) return { grade: 'A', color: 'text-success-600' };
  if (score >= 80) return { grade: 'B+', color: 'text-success-500' };
  if (score >= 75) return { grade: 'B', color: 'text-primary-600' };
  if (score >= 70) return { grade: 'C+', color: 'text-warning-600' };
  if (score >= 65) return { grade: 'C', color: 'text-warning-600' };
  if (score >= 60) return { grade: 'D+', color: 'text-error-500' };
  if (score >= 55) return { grade: 'D', color: 'text-error-600' };
  return { grade: 'F', color: 'text-error-700' };
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format employment type
 */
export const formatEmploymentType = (type) => {
  const types = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    'contract': 'Contract',
    'internship': 'Internship',
    'freelance': 'Freelance'
  };
  return types[type] || capitalize(type);
};

/**
 * Format work mode
 */
export const formatWorkMode = (mode) => {
  const modes = {
    'remote': 'Remote',
    'hybrid': 'Hybrid',
    'onsite': 'On-site'
  };
  return modes[mode] || capitalize(mode);
};

/**
 * Format experience level
 */
export const formatExperienceLevel = (level) => {
  const levels = {
    'entry': 'Entry Level',
    'mid': 'Mid Level',
    'senior': 'Senior Level',
    'lead': 'Lead/Principal',
    'executive': 'Executive'
  };
  return levels[level] || capitalize(level);
};

/**
 * Format notification type for display
 */
export const formatNotificationType = (type) => {
  const types = {
    'otp_verification': 'Email Verification',
    'job_match': 'Job Match',
    'resume_refresh_reminder': 'Resume Refresh',
    'welcome': 'Welcome',
    'password_reset': 'Password Reset',
    'application_status': 'Application Update',
    'interview_scheduled': 'Interview Scheduled',
    'profile_completion': 'Profile Completion',
    'job_alert': 'Job Alert',
    'resume_analysis_complete': 'Resume Analysis'
  };
  return types[type] || capitalize(type.replace(/_/g, ' '));
};

/**
 * Get status badge props
 */
export const getStatusBadgeProps = (status) => {
  const statusMap = {
    'active': { text: 'Active', className: 'badge-success' },
    'inactive': { text: 'Inactive', className: 'badge-gray' },
    'pending': { text: 'Pending', className: 'badge-warning' },
    'completed': { text: 'Completed', className: 'badge-success' },
    'failed': { text: 'Failed', className: 'badge-error' },
    'draft': { text: 'Draft', className: 'badge-gray' },
    'published': { text: 'Published', className: 'badge-success' },
    'paused': { text: 'Paused', className: 'badge-warning' },
    'closed': { text: 'Closed', className: 'badge-error' },
    'sent': { text: 'Sent', className: 'badge-success' },
    'delivered': { text: 'Delivered', className: 'badge-success' },
    'bounced': { text: 'Bounced', className: 'badge-error' },
    'opened': { text: 'Opened', className: 'badge-primary' }
  };
  
  return statusMap[status] || { text: capitalize(status), className: 'badge-secondary' };
};

/**
 * Format skill tags
 */
export const formatSkillTags = (skills, maxDisplay = 5) => {
  if (!skills || !Array.isArray(skills)) return [];
  
  const displayed = skills.slice(0, maxDisplay);
  const remaining = skills.length - maxDisplay;
  
  return {
    displayed,
    remaining: remaining > 0 ? remaining : 0,
    hasMore: remaining > 0
  };
};

/**
 * Calculate profile completion suggestions
 */
export const getProfileCompletionSuggestions = (profile) => {
  const suggestions = [];
  
  if (!profile.firstName) suggestions.push('Add your first name');
  if (!profile.lastName) suggestions.push('Add your last name');
  if (!profile.phone) suggestions.push('Add your phone number');
  if (!profile.avatar) suggestions.push('Upload a profile picture');
  if (!profile.location?.city) suggestions.push('Add your location');
  if (!profile.skills || profile.skills.length < 5) suggestions.push('Add more skills');
  if (!profile.experience || profile.experience.length === 0) suggestions.push('Add work experience');
  if (!profile.education || profile.education.length === 0) suggestions.push('Add education');
  if (!profile.preferences?.jobTypes || profile.preferences.jobTypes.length === 0) suggestions.push('Set job preferences');
  if (!profile.preferences?.expectedSalary?.min) suggestions.push('Set salary expectations');
  
  return suggestions;
};

/**
 * Format notification time
 */
export const formatNotificationTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diffTime = now - target;
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(date, { month: 'short', day: 'numeric' });
};

/**
 * Format user role for display
 */
export const formatUserRole = (role) => {
  const roles = {
    'admin': 'Administrator',
    'recruiter': 'Recruiter',
    'candidate': 'Job Seeker'
  };
  return roles[role] || capitalize(role);
};

/**
 * Get user status badge props
 */
export const getUserStatusBadge = (status) => {
  const statusMap = {
    'active': { text: 'Active', className: 'bg-success-100 text-success-700' },
    'inactive': { text: 'Inactive', className: 'bg-gray-100 text-gray-700' },
    'suspended': { text: 'Suspended', className: 'bg-error-100 text-error-700' },
    'pending': { text: 'Pending', className: 'bg-warning-100 text-warning-700' }
  };
  
  return statusMap[status] || { text: capitalize(status), className: 'bg-gray-100 text-gray-700' };
};

/**
 * Format numbers with commas
 */
export const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};
