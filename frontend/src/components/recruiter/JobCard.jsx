import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit3, 
  Trash2, 
  Eye, 
  Play,
  Pause,
  MapPin,
  DollarSign,
  Clock,
  Users,
  BarChart3,
  Calendar,
  Building,
  ExternalLink,
  MoreHorizontal,
  Target,
  TrendingUp
} from 'lucide-react';

import { cn } from '../../utils/cn';
import { 
  formatSalaryRange, 
  formatRelativeTime, 
  formatEmploymentType,
  formatWorkMode,
  getStatusBadgeProps 
} from '../../utils/formatters';

const JobCard = ({ job, index, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const statusBadge = getStatusBadgeProps(job.status);

  const handleToggleStatus = () => {
    // This would call an API to toggle job status
    console.log('Toggle job status:', job._id);
  };

  const handleViewApplications = () => {
    // This would navigate to applications view
    console.log('View applications for job:', job._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="dashboard-card card-hover"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        {/* Job Information */}
        <div className="flex-1 mb-4 lg:mb-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h4 className="text-lg font-semibold text-gray-900 hover:text-accent-600 cursor-pointer">
                  {job.title}
                </h4>
                <span className={cn("badge", statusBadge.className)}>
                  {statusBadge.text}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-1" />
                  {job.company?.name || 'Company'}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {job.location.city}, {job.location.state}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Posted {formatRelativeTime(job.createdAt)}
                </div>
              </div>

              {/* Job Details */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {formatEmploymentType(job.employmentType)}
                </span>
                <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium">
                  {formatWorkMode(job.location.workMode)}
                </span>
                {job.experienceLevel && (
                  <span className="px-2 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                    {job.experienceLevel} level
                  </span>
                )}
                {job.salary && (
                  <span className="px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
                    {formatSalaryRange(job.salary)}
                  </span>
                )}
              </div>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Required Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 6).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 6 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{job.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Application Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  <span className="font-medium">{job.applicationCount || 0}</span>
                  <span className="ml-1">applications</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Eye className="w-4 h-4 mr-1" />
                  <span className="font-medium">{job.viewCount || 0}</span>
                  <span className="ml-1">views</span>
                </div>
                {job.applicationDeadline && (
                  <div className="flex items-center text-warning-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="text-xs">
                      Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative ml-4">
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
                      handleViewApplications();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-3 text-gray-400" />
                    View Applications
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowStats(!showStats);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 mr-3 text-gray-400" />
                    View Analytics
                  </button>
                  
                  <button
                    onClick={() => {
                      onEdit(job);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-3 text-gray-400" />
                    Edit Job
                  </button>
                  
                  <button
                    onClick={() => {
                      handleToggleStatus();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {job.status === 'active' ? (
                      <>
                        <Pause className="w-4 h-4 mr-3 text-gray-400" />
                        Pause Job
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-3 text-gray-400" />
                        Activate Job
                      </>
                    )}
                  </button>
                  
                  <div className="border-t border-gray-100 my-1" />
                  
                  <button
                    onClick={() => {
                      onDelete(job._id);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete Job
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewApplications}
            className="btn btn-secondary btn-sm"
          >
            <Users className="w-4 h-4 mr-2" />
            {job.applicationCount || 0} Applications
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(job)}
            className="btn btn-accent btn-sm"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </motion.button>
        </div>
      </div>

      {/* Expandable Stats Section */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-primary-50 rounded-lg">
              <div className="text-xl font-bold text-primary-600">{job.viewCount || 0}</div>
              <div className="text-xs text-gray-600">Views</div>
            </div>
            <div className="text-center p-3 bg-secondary-50 rounded-lg">
              <div className="text-xl font-bold text-secondary-600">{job.applicationCount || 0}</div>
              <div className="text-xs text-gray-600">Applications</div>
            </div>
            <div className="text-center p-3 bg-accent-50 rounded-lg">
              <div className="text-xl font-bold text-accent-600">
                {job.applicationCount > 0 ? ((job.applicationCount / (job.viewCount || 1)) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-gray-600">Conversion</div>
            </div>
            <div className="text-center p-3 bg-success-50 rounded-lg">
              <div className="text-xl font-bold text-success-600">85%</div>
              <div className="text-xs text-gray-600">Avg Match</div>
            </div>
          </div>
        </motion.div>
      )}

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

export default JobCard;
