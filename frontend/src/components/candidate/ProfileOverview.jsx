import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Edit3, 
  Camera,
  Star,
  TrendingUp,
  Award,
  Target,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';

import { cn } from '../../utils/cn';
import { formatPercentage, getProfileCompletionSuggestions, formatRelativeTime } from '../../utils/formatters';

const ProfileOverview = ({ 
  profile, 
  profileCompletion, 
  refetchProfile 
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);

  const completion = profileCompletion?.profileCompletion || 0;
  const suggestions = profileCompletion?.suggestions || getProfileCompletionSuggestions(profile || {});

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Profile Header Card */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Profile Info */}
          <div className="flex items-start space-x-4 mb-6 lg:mb-0">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-400 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {profile?.firstName?.[0] || 'U'}
                  </span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-medium border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-3 h-3 text-gray-600" />
              </motion.button>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.fullName || profile?.firstName || 'Complete your profile'}
              </h2>
              <p className="text-gray-600 mt-1">
                {profile?.experience?.[0]?.position || 'Add your current position'}
              </p>
              
              {/* Contact Info */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                {profile?.location?.city && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profile.location.city}, {profile.location.state}
                  </div>
                )}
                {profile?.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {profile.email}
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {profile.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditModalOpen(true)}
              className="btn btn-primary btn-md"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Profile Completion */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Profile Completion</h3>
            <Target className="w-5 h-5 text-primary-500" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatPercentage(completion)}
              </span>
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                completion >= 80 ? "bg-success-100 text-success-700" :
                completion >= 60 ? "bg-warning-100 text-warning-700" :
                "bg-error-100 text-error-700"
              )}>
                {completion >= 80 ? 'Complete' : completion >= 60 ? 'Good' : 'Needs Work'}
              </div>
            </div>
            
            <div className="progress h-2">
              <motion.div
                className="progress-bar h-full"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            
            <p className="text-xs text-gray-500">
              {completion < 100 ? `${100 - completion}% to complete` : 'Profile complete!'}
            </p>
          </div>
        </motion.div>

        {/* Skills Count */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Skills</h3>
            <Star className="w-5 h-5 text-secondary-500" />
          </div>
          
          <div className="space-y-2">
            <span className="text-2xl font-bold text-gray-900">
              {profile?.skills?.length || 0}
            </span>
            <p className="text-xs text-gray-500">
              {profile?.skills?.length >= 10 ? 'Excellent variety' :
               profile?.skills?.length >= 5 ? 'Good coverage' :
               'Add more skills'}
            </p>
          </div>
        </motion.div>

        {/* Experience */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Experience</h3>
            <TrendingUp className="w-5 h-5 text-accent-500" />
          </div>
          
          <div className="space-y-2">
            <span className="text-2xl font-bold text-gray-900">
              {profile?.experience?.length || 0}
            </span>
            <p className="text-xs text-gray-500">
              {profile?.experience?.length > 0 ? 'Positions added' : 'Add work experience'}
            </p>
          </div>
        </motion.div>

        {/* Last Updated */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Last Updated</h3>
            <Award className="w-5 h-5 text-success-500" />
          </div>
          
          <div className="space-y-2">
            <span className="text-sm font-semibold text-gray-900">
              {formatRelativeTime(profile?.lastProfileUpdate)}
            </span>
            <p className="text-xs text-gray-500">
              Keep your profile fresh
            </p>
          </div>
        </motion.div>
      </div>

      {/* Profile Completion Suggestions */}
      {suggestions.length > 0 && (
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
            <AlertCircle className="w-5 h-5 text-warning-500" />
          </div>
          
          <p className="text-gray-600 mb-4">
            Complete these sections to improve your job matching and visibility to recruiters.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setEditModalOpen(true)}
              >
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <Plus className="w-3 h-3 text-primary-600" />
                </div>
                <span className="text-sm text-gray-700">{suggestion}</span>
              </motion.div>
            ))}
          </div>
          
          {suggestions.length > 6 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setEditModalOpen(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all {suggestions.length} suggestions
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Skills & Experience Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
            <button
              onClick={() => setEditModalOpen(true)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Edit
            </button>
          </div>
          
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.slice(0, 12).map((skill, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                >
                  {skill}
                </motion.span>
              ))}
              {profile.skills.length > 12 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  +{profile.skills.length - 12} more
                </span>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No skills added yet</p>
              <button
                onClick={() => setEditModalOpen(true)}
                className="btn btn-primary btn-sm"
              >
                Add Skills
              </button>
            </div>
          )}
        </motion.div>

        {/* Recent Experience */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
            <button
              onClick={() => setEditModalOpen(true)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Edit
            </button>
          </div>
          
          {profile?.experience && profile.experience.length > 0 ? (
            <div className="space-y-4">
              {profile.experience.slice(0, 3).map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {exp.position}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">{exp.company}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {exp.startDate} - {exp.endDate || (exp.current ? 'Present' : '')}
                    </p>
                  </div>
                  {exp.current && (
                    <div className="px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
                      Current
                    </div>
                  )}
                </motion.div>
              ))}
              
              {profile.experience.length > 3 && (
                <div className="text-center">
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all {profile.experience.length} positions
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No experience added yet</p>
              <button
                onClick={() => setEditModalOpen(true)}
                className="btn btn-primary btn-sm"
              >
                Add Experience
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditModalOpen(true)}
            className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-xl hover:shadow-medium transition-all text-left"
          >
            <User className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Update Profile</h4>
            <p className="text-sm text-gray-600">Add skills, experience, and preferences</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-gradient-to-r from-accent-50 to-accent-100 border border-accent-200 rounded-xl hover:shadow-medium transition-all text-left"
          >
            <CheckCircle2 className="w-6 h-6 text-accent-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Complete Setup</h4>
            <p className="text-sm text-gray-600">Finish profile for better matches</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-xl hover:shadow-medium transition-all text-left"
          >
            <Award className="w-6 h-6 text-success-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">View Achievements</h4>
            <p className="text-sm text-gray-600">Track your career progress</p>
          </motion.button>
        </div>
      </motion.div>

      {/* Profile Completion Progress */}
      {completion < 100 && (
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Boost Your Profile</h3>
              <p className="text-gray-600 mt-1">
                Complete these sections to increase your visibility to recruiters
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">{formatPercentage(completion)}</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>

          <div className="space-y-3">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer group"
                onClick={() => setEditModalOpen(true)}
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3 group-hover:bg-primary-100 transition-colors">
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                </div>
                <span className="text-sm text-gray-700 group-hover:text-primary-700 transition-colors">
                  {suggestion}
                </span>
              </motion.div>
            ))}
          </div>

          {suggestions.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setEditModalOpen(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all {suggestions.length} suggestions
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Success Message for Complete Profile */}
      {completion === 100 && (
        <motion.div
          variants={cardVariants}
          className="dashboard-card bg-gradient-to-r from-success-50 to-success-100 border-success-200"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-success-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-success-900">Profile Complete!</h3>
              <p className="text-success-700 mt-1">
                Your profile is optimized for maximum visibility to recruiters and AI job matching.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Profile Modal - Placeholder */}
      {editModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setEditModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-xl shadow-large max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center py-12">
                <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Editor</h3>
                <p className="text-gray-600 mb-6">
                  The profile editor component will be implemented in the next phase.
                </p>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="btn btn-primary btn-md"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProfileOverview;
