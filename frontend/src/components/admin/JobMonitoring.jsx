import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Briefcase, 
  Search, 
  Filter, 
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Edit3,
  Trash2,
  MoreHorizontal,
  MapPin,
  Building,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Ban,
  Play,
  Pause,
  TrendingUp,
  Download,
  Flag
} from 'lucide-react';
import toast from 'react-hot-toast';

import { adminAPI, jobsAPI } from '../../services/api';
import { cn } from '../../utils/cn';
import { 
  formatRelativeTime, 
  formatSalaryRange,
  formatEmploymentType,
  formatWorkMode,
  getStatusBadgeProps 
} from '../../utils/formatters';
import JobRow from './JobRow';

const JobMonitoring = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    approval: 'all',
    search: ''
  });
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const queryClient = useQueryClient();

  // Fetch all jobs
  const { data: jobsData, isLoading, refetch } = useQuery(
    ['admin-jobs', filters],
    () => adminAPI.getAllJobs({
      status: filters.status !== 'all' ? filters.status : undefined,
      approval: filters.approval !== 'all' ? filters.approval : undefined,
      search: filters.search || undefined,
      limit: 100
    }),
    {
      select: (response) => response.data,
      staleTime: 2 * 60 * 1000,
    }
  );

  // Job moderation mutations
  const approveJobMutation = useMutation(
    (jobId) => adminAPI.approveJob(jobId),
    {
      onSuccess: () => {
        toast.success('Job approved successfully');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to approve job');
      },
    }
  );

  const rejectJobMutation = useMutation(
    ({ jobId, reason }) => adminAPI.rejectJob(jobId, reason),
    {
      onSuccess: () => {
        toast.success('Job rejected successfully');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to reject job');
      },
    }
  );

  const flagJobMutation = useMutation(
    ({ jobId, reason }) => adminAPI.flagJob(jobId, reason),
    {
      onSuccess: () => {
        toast.success('Job flagged for review');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to flag job');
      },
    }
  );

  const deleteJobMutation = useMutation(
    (jobId) => adminAPI.deleteJob(jobId),
    {
      onSuccess: () => {
        toast.success('Job deleted successfully');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete job');
      },
    }
  );

  const bulkJobActionMutation = useMutation(
    ({ action, jobIds, reason }) => adminAPI.bulkJobAction(action, jobIds, reason),
    {
      onSuccess: (data, variables) => {
        toast.success(`Bulk ${variables.action} completed successfully`);
        setSelectedJobs(new Set());
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Bulk action failed');
      },
    }
  );

  const jobs = jobsData?.data || [];
  const totalJobs = jobsData?.total || 0;

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = filters.status === 'all' || job.status === filters.status;
    const matchesApproval = filters.approval === 'all' || job.moderationStatus === filters.approval;
    const matchesSearch = !filters.search || 
      job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.company.name.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesApproval && matchesSearch;
  });

  const handleJobAction = (action, jobId, reason = null) => {
    switch (action) {
      case 'approve':
        approveJobMutation.mutate(jobId);
        break;
      case 'reject':
        const rejectReason = reason || prompt('Please provide a reason for rejection:');
        if (rejectReason) {
          rejectJobMutation.mutate({ jobId, reason: rejectReason });
        }
        break;
      case 'flag':
        const flagReason = reason || prompt('Please provide a reason for flagging:');
        if (flagReason) {
          flagJobMutation.mutate({ jobId, reason: flagReason });
        }
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
          deleteJobMutation.mutate(jobId);
        }
        break;
      default:
        break;
    }
  };

  const handleBulkAction = (action) => {
    if (selectedJobs.size === 0) {
      toast.error('Please select jobs first');
      return;
    }

    let reason = null;
    if (action === 'reject' || action === 'flag') {
      reason = prompt(`Please provide a reason for ${action}ing these jobs:`);
      if (!reason) return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedJobs.size} jobs?`;
    if (window.confirm(confirmMessage)) {
      bulkJobActionMutation.mutate({
        action,
        jobIds: Array.from(selectedJobs),
        reason
      });
    }
  };

  const handleSelectJob = (jobId) => {
    const newSelected = new Set(selectedJobs);
    if (selectedJobs.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(filteredJobs.map(job => job._id)));
    }
  };

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
      {/* Job Monitoring Header */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Job Monitoring</h3>
            <p className="text-gray-600 mt-1">
              {totalJobs} total jobs • {filteredJobs.length} shown
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button className="btn btn-secondary btn-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Jobs
            </button>
            <button className="btn btn-primary btn-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 input"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filters.approval}
            onChange={(e) => setFilters(prev => ({ ...prev, approval: e.target.value }))}
            className="input"
          >
            <option value="all">All Approvals</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
          </select>

          <button
            onClick={() => setFilters({ status: 'all', approval: 'all', search: '' })}
            className="btn btn-secondary btn-md"
          >
            Clear Filters
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedJobs.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-lg mb-6"
          >
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-primary-900">
                {selectedJobs.size} jobs selected
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="btn btn-success btn-sm"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="btn btn-error btn-sm"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </button>
              <button
                onClick={() => handleBulkAction('flag')}
                className="btn btn-warning btn-sm"
              >
                <Flag className="w-4 h-4 mr-1" />
                Flag
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="btn btn-error btn-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Job Statistics */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {jobs.filter(j => j.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Jobs</div>
          </div>

          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <div className="text-2xl font-bold text-warning-600 mb-1">
              {jobs.filter(j => j.moderationStatus === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>

          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600 mb-1">
              {jobs.filter(j => j.moderationStatus === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>

          <div className="text-center p-4 bg-error-50 rounded-lg">
            <div className="text-2xl font-bold text-error-600 mb-1">
              {jobs.filter(j => j.moderationStatus === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>

          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <div className="text-2xl font-bold text-accent-600 mb-1">
              {jobs.filter(j => j.moderationStatus === 'flagged').length}
            </div>
            <div className="text-sm text-gray-600">Flagged</div>
          </div>
        </div>
      </motion.div>

      {/* Jobs Table */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Job</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Company</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Moderation</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Applications</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Posted</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
                    <p className="text-gray-600">Loading jobs...</p>
                  </td>
                </tr>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job, index) => (
                  <JobTableRow
                    key={job._id}
                    job={job}
                    index={index}
                    isSelected={selectedJobs.has(job._id)}
                    onSelect={handleSelectJob}
                    onAction={handleJobAction}
                    onView={(job) => {
                      setSelectedJob(job);
                      setShowJobModal(true);
                    }}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
                    <p className="text-gray-600">
                      {filters.search || filters.status !== 'all' || filters.approval !== 'all'
                        ? 'No jobs match your current filters.'
                        : 'No jobs posted yet.'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Job Detail Modal */}
      {showJobModal && selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => {
            setShowJobModal(false);
            setSelectedJob(null);
          }}
          onAction={handleJobAction}
        />
      )}
    </motion.div>
  );
};

// Job Table Row Component
const JobTableRow = ({ job, index, isSelected, onSelect, onAction, onView }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusBadge = getStatusBadgeProps(job.status);
  
  const getModerationBadge = (status) => {
    switch (status) {
      case 'approved':
        return { className: 'bg-success-100 text-success-700', text: 'Approved' };
      case 'rejected':
        return { className: 'bg-error-100 text-error-700', text: 'Rejected' };
      case 'flagged':
        return { className: 'bg-warning-100 text-warning-700', text: 'Flagged' };
      case 'pending':
      default:
        return { className: 'bg-gray-100 text-gray-700', text: 'Pending' };
    }
  };

  const moderationBadge = getModerationBadge(job.moderationStatus);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-gray-100 hover:bg-gray-50"
    >
      <td className="py-3 px-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(job._id)}
          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
        />
      </td>
      
      <td className="py-3 px-4">
        <div>
          <p className="font-medium text-gray-900 truncate max-w-xs">{job.title}</p>
          <div className="flex items-center space-x-2 mt-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-sm text-gray-500">{job.location.city}, {job.location.state}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-sm text-gray-500">{formatWorkMode(job.location.workMode)}</span>
          </div>
        </div>
      </td>
      
      <td className="py-3 px-4">
        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">{job.company.name}</span>
        </div>
      </td>
      
      <td className="py-3 px-4">
        <span className={cn("badge", statusBadge.className)}>
          {statusBadge.text}
        </span>
      </td>
      
      <td className="py-3 px-4">
        <span className={cn("badge", moderationBadge.className)}>
          {moderationBadge.text}
        </span>
      </td>
      
      <td className="py-3 px-4">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">{job.applicationCount || 0}</span>
        </div>
      </td>
      
      <td className="py-3 px-4 text-sm text-gray-600">
        {formatRelativeTime(job.createdAt)}
      </td>
      
      <td className="py-3 px-4">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-large border border-gray-200 py-2 z-10"
            >
              <button
                onClick={() => {
                  onView(job);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 mr-3 text-gray-400" />
                View Details
              </button>
              
              {job.moderationStatus === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      onAction('approve', job._id);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-success-600 hover:bg-success-50 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-3" />
                    Approve Job
                  </button>
                  
                  <button
                    onClick={() => {
                      onAction('reject', job._id);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-3" />
                    Reject Job
                  </button>
                </>
              )}
              
              <button
                onClick={() => {
                  onAction('flag', job._id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 transition-colors"
              >
                <Flag className="w-4 h-4 mr-3" />
                Flag Job
              </button>
              
              <div className="border-t border-gray-100 my-1" />
              
              <button
                onClick={() => {
                  onAction('delete', job._id);
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
      </td>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </motion.tr>
  );
};

// Job Detail Modal Component
const JobDetailModal = ({ job, onClose, onAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-xl shadow-large max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{job.company.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{job.location.city}, {job.location.state}</span>
                </div>
                <span className={cn("badge", getStatusBadgeProps(job.status).className)}>
                  {getStatusBadgeProps(job.status).text}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Employment Type:</span>
                  <p className="font-medium">{formatEmploymentType(job.employmentType)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Work Mode:</span>
                  <p className="font-medium">{formatWorkMode(job.location.workMode)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Experience Level:</span>
                  <p className="font-medium">{job.experienceLevel || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Salary:</span>
                  <p className="font-medium">{job.salary ? formatSalaryRange(job.salary) : 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Application Deadline:</span>
                  <p className="font-medium">
                    {job.applicationDeadline ? 
                      new Date(job.applicationDeadline).toLocaleDateString() : 
                      'No deadline'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Applications:</span>
                  <p className="font-medium">{job.applicationCount || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Views:</span>
                  <p className="font-medium">{job.viewCount || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Posted:</span>
                  <p className="font-medium">{new Date(job.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <p className="font-medium">{new Date(job.updatedAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Posted By:</span>
                  <p className="font-medium">{job.postedBy?.email || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
            <div className="prose max-w-none text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
              {job.description}
            </div>
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requirements & Responsibilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-secondary-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Moderation Notes */}
          {job.moderationNotes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Moderation Notes</h3>
              <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-800">{job.moderationNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          {job.moderationStatus === 'pending' && (
            <>
              <button
                onClick={() => {
                  onAction('approve', job._id);
                  onClose();
                }}
                className="btn btn-success btn-md"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Job
              </button>
              
              <button
                onClick={() => {
                  onAction('reject', job._id);
                  onClose();
                }}
                className="btn btn-error btn-md"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Job
              </button>
            </>
          )}
          
          <button
            onClick={() => {
              onAction('flag', job._id);
              onClose();
            }}
            className="btn btn-warning btn-md"
          >
            <Flag className="w-4 h-4 mr-2" />
            Flag Job
          </button>
          
          <button
            onClick={onClose}
            className="btn btn-secondary btn-md"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default JobMonitoring;
