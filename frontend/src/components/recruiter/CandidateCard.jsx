import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star,
  Mail,
  Calendar,
  Download,
  Eye,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  Phone,
  ExternalLink,
  Send,
  Clock,
  CheckCircle2,
  User,
  MoreHorizontal,
  MessageSquare
} from 'lucide-react';

import { cn } from '../../utils/cn';
import { 
  getMatchScoreColor, 
  formatRelativeTime,
  truncateText,
  formatPercentage 
} from '../../utils/formatters';

const CandidateCard = ({ 
  candidateMatch, 
  job, 
  index, 
  isSelected, 
  onSelect, 
  onSendNotification 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { candidate, overallScore, breakdown, matchedSkills, missingSkills } = candidateMatch;
  const profile = candidate.profile || {};
  const resume = candidate.resume || {};

  const handleScheduleInterview = () => {
    // This would open interview scheduling modal
    console.log('Schedule interview with:', candidate.id);
  };

  const handleDownloadResume = () => {
    // This would download the candidate's resume
    console.log('Download resume:', resume.id);
  };

  const handleViewProfile = () => {
    // This would open candidate profile modal
    console.log('View profile:', candidate.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "dashboard-card transition-all duration-200",
        isSelected && "ring-2 ring-accent-500 bg-accent-50/30"
      )}
    >
      <div className="flex items-start space-x-4">
        {/* Selection Checkbox */}
        <div className="pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(candidate.id)}
            className="w-4 h-4 text-accent-600 bg-gray-100 border-gray-300 rounded focus:ring-accent-500 focus:ring-2"
          />
        </div>

        {/* Candidate Avatar */}
        <div className="w-16 h-16 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.fullName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-lg">
              {profile.firstName?.[0] || 'C'}
            </span>
          )}
        </div>

        {/* Candidate Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h4 className="text-lg font-semibold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h4>
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border",
                  getMatchScoreColor(overallScore)
                )}>
                  {overallScore}% Match
                </div>
              </div>
              
              <p className="text-gray-600 mb-2">
                {candidate.experience?.[0]?.position || 'Professional'}
                {candidate.experience?.[0]?.company && ` at ${candidate.experience[0].company}`}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                {profile.location?.city && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profile.location.city}, {profile.location.state}
                  </div>
                )}
                
                {candidate.experience?.length > 0 && (
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {candidate.experience.length} positions
                  </div>
                )}
                
                {resume.atsScore > 0 && (
                  <div className="flex items-center">
                    <Award className="w-4 h-4 mr-1" />
                    ATS: {resume.atsScore}%
                  </div>
                )}
                
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatRelativeTime(resume.uploadedAt)}
                </div>
              </div>

              {/* Matched Skills */}
              {matchedSkills && matchedSkills.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Matched Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {matchedSkills.slice(0, 6).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {matchedSkills.length > 6 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{matchedSkills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {missingSkills && missingSkills.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Skills to Develop:</div>
                  <div className="flex flex-wrap gap-1">
                    {missingSkills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-warning-100 text-warning-700 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {missingSkills.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{missingSkills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </motion.button>

              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-large border border-gray-200 py-2 z-10"
                >
                  <button
                    onClick={() => {
                      handleViewProfile();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    View Full Profile
                  </button>
                  
                  <button
                    onClick={() => {
                      handleDownloadResume();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-3 text-gray-400" />
                    Download Resume
                  </button>
                  
                  <button
                    onClick={() => {
                      onSendNotification(candidateMatch);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                    Send Job Match
                  </button>
                  
                  <button
                    onClick={() => {
                      handleScheduleInterview();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                    Schedule Interview
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 mt-4 lg:mt-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSendNotification(candidateMatch)}
            className="btn btn-primary btn-sm"
          >
            <Mail className="w-4 h-4 mr-2" />
            Notify
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleScheduleInterview}
            className="btn btn-secondary btn-sm"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Interview
          </motion.button>
        </div>
      </div>

      {/* Match Details */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <Target className="w-4 h-4 text-primary-500 mr-2" />
            <span className="text-gray-600">Skills: </span>
            <span className="font-medium ml-1">{breakdown?.skills || 0}%</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-accent-500 mr-2" />
            <span className="text-gray-600">Experience: </span>
            <span className="font-medium ml-1">{breakdown?.experience || 0}%</span>
          </div>
          <div className="flex items-center">
            <Award className="w-4 h-4 text-secondary-500 mr-2" />
            <span className="text-gray-600">Keywords: </span>
            <span className="font-medium ml-1">{breakdown?.keywords || 0}%</span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-success-500 mr-2" />
            <span className="text-gray-600">Overall: </span>
            <span className="font-medium ml-1">{overallScore}%</span>
          </div>
        </div>

        {/* Expandable Details */}
        <div className="mt-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-accent-600 hover:text-accent-700 font-medium"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4"
          >
            {/* Experience */}
            {candidate.experience && candidate.experience.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Experience</h5>
                <div className="space-y-2">
                  {candidate.experience.slice(0, 2).map((exp, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">{exp.position}</div>
                      <div className="text-sm text-gray-600">{exp.company}</div>
                      <div className="text-xs text-gray-500">{exp.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {candidate.skills?.technical && candidate.skills.technical.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Technical Skills</h5>
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.technical.slice(0, 10).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-accent-100 text-accent-700 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Info */}
            {resume.name && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Resume</h5>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-accent-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{resume.name}</div>
                      <div className="text-xs text-gray-500">
                        ATS Score: {resume.atsScore}% • Uploaded {formatRelativeTime(resume.uploadedAt)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadResume}
                    className="btn btn-secondary btn-sm"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </motion.div>
  );
};

export default CandidateCard;
