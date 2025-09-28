import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
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
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { jobsAPI } from '../../services/api';
import { cn } from '../../utils/cn';
import { 
  formatSalaryRange, 
  formatRelativeTime, 
  formatEmploymentType,
  formatWorkMode,
  getStatusBadgeProps 
} from '../../utils/formatters';
import JobCard from './JobCard';

const JobManagement = ({ myJobs, refetchJobs }) => {
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const queryClient = useQueryClient();

  // Form handling
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();

  // Create job mutation
  const createJobMutation = useMutation(
    (jobData) => jobsAPI.createJob(jobData),
    {
      onSuccess: () => {
        toast.success('Job posted successfully!');
        refetchJobs();
        setShowJobForm(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create job');
      },
    }
  );

  // Update job mutation
  const updateJobMutation = useMutation(
    ({ jobId, jobData }) => jobsAPI.updateJob(jobId, jobData),
    {
      onSuccess: () => {
        toast.success('Job updated successfully!');
        refetchJobs();
        setEditingJob(null);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update job');
      },
    }
  );

  // Delete job mutation
  const deleteJobMutation = useMutation(
    (jobId) => jobsAPI.deleteJob(jobId),
    {
      onSuccess: () => {
        toast.success('Job deleted successfully!');
        refetchJobs();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete job');
      },
    }
  );

  // Filter jobs
  const filteredJobs = myJobs?.filter(job => {
    const matchesStatus = filters.status === 'all' || job.status === filters.status;
    const matchesSearch = !filters.search || 
      job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.company.name.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];

  const handleJobSubmit = (data) => {
    const jobData = {
      ...data,
      skills: data.skills ? data.skills.split(',').map(skill => skill.trim()) : [],
      requirements: data.requirements ? data.requirements.split('\n').filter(req => req.trim()) : [],
      responsibilities: data.responsibilities ? data.responsibilities.split('\n').filter(resp => resp.trim()) : [],
      benefits: data.benefits ? data.benefits.split(',').map(benefit => benefit.trim()) : [],
      location: {
        city: data.city,
        state: data.state,
        country: data.country || 'United States',
        workMode: data.workMode,
        isRemote: data.workMode === 'remote'
      },
      salary: data.salaryMin || data.salaryMax ? {
        min: data.salaryMin ? parseInt(data.salaryMin) : undefined,
        max: data.salaryMax ? parseInt(data.salaryMax) : undefined,
        currency: 'USD',
        period: data.salaryPeriod || 'yearly'
      } : undefined,
      company: {
        name: data.companyName || profile?.company?.name,
        website: data.companyWebsite || profile?.company?.website,
        industry: data.industry || profile?.company?.industry
      }
    };

    if (editingJob) {
      updateJobMutation.mutate({ jobId: editingJob._id, jobData });
    } else {
      createJobMutation.mutate(jobData);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowJobForm(true);
    
    // Populate form with existing data
    reset({
      title: job.title,
      description: job.description,
      companyName: job.company.name,
      city: job.location.city,
      state: job.location.state,
      workMode: job.location.workMode,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      skills: job.skills?.join(', '),
      requirements: job.requirements?.join('\n'),
      responsibilities: job.responsibilities?.join('\n'),
      benefits: job.benefits?.join(', '),
      salaryMin: job.salary?.min,
      salaryMax: job.salary?.max,
      salaryPeriod: job.salary?.period,
      applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : ''
    });
  };

  const handleDeleteJob = (jobId) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      deleteJobMutation.mutate(jobId);
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
      {/* Job Management Header */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Job Management</h3>
            <p className="text-gray-600 mt-1">
              {myJobs?.length || 0} total jobs • {filteredJobs.length} shown
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingJob(null);
              setShowJobForm(true);
              reset();
            }}
            className="btn btn-primary btn-md mt-4 sm:mt-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
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
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </motion.div>

      {/* Jobs List */}
      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job, index) => (
            <JobCard
              key={job._id}
              job={job}
              index={index}
              onEdit={handleEditJob}
              onDelete={handleDeleteJob}
            />
          ))}
        </div>
      ) : (
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {myJobs?.length === 0 ? 'No Jobs Posted Yet' : 'No Jobs Match Filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {myJobs?.length === 0 
                ? 'Start by posting your first job to attract top talent'
                : 'Try adjusting your search filters to see more jobs'
              }
            </p>
            {myJobs?.length === 0 && (
              <button
                onClick={() => {
                  setEditingJob(null);
                  setShowJobForm(true);
                  reset();
                }}
                className="btn btn-primary btn-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Your First Job
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Job Form Modal */}
      {showJobForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowJobForm(false)}
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
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingJob ? 'Edit Job Posting' : 'Post New Job'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {editingJob ? 'Update your job posting details' : 'Create a new job posting to attract candidates'}
                  </p>
                </div>
                <button
                  onClick={() => setShowJobForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit(handleJobSubmit)} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      {...register('title', { required: 'Job title is required' })}
                      className={cn("input", errors.title && "input-error")}
                      placeholder="e.g., Senior Software Engineer"
                    />
                    {errors.title && (
                      <p className="text-error-600 text-sm mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      {...register('companyName')}
                      className="input"
                      placeholder="Your company name"
                      defaultValue={profile?.company?.name}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    {...register('description', { required: 'Job description is required' })}
                    rows={6}
                    className={cn("input resize-none", errors.description && "input-error")}
                    placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  />
                  {errors.description && (
                    <p className="text-error-600 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Location & Work Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Location & Work Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      {...register('city', { required: 'City is required' })}
                      className={cn("input", errors.city && "input-error")}
                      placeholder="San Francisco"
                    />
                    {errors.city && (
                      <p className="text-error-600 text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      {...register('state', { required: 'State is required' })}
                      className={cn("input", errors.state && "input-error")}
                      placeholder="CA"
                    />
                    {errors.state && (
                      <p className="text-error-600 text-sm mt-1">{errors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Mode *
                    </label>
                    <select
                      {...register('workMode', { required: 'Work mode is required' })}
                      className={cn("input", errors.workMode && "input-error")}
                    >
                      <option value="">Select work mode</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                    {errors.workMode && (
                      <p className="text-error-600 text-sm mt-1">{errors.workMode.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type *
                    </label>
                    <select
                      {...register('employmentType', { required: 'Employment type is required' })}
                      className={cn("input", errors.employmentType && "input-error")}
                    >
                      <option value="">Select employment type</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="freelance">Freelance</option>
                    </select>
                    {errors.employmentType && (
                      <p className="text-error-600 text-sm mt-1">{errors.employmentType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      {...register('experienceLevel')}
                      className="input"
                    >
                      <option value="">Select experience level</option>
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                      <option value="lead">Lead/Principal</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Skills & Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Skills & Requirements</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills (comma-separated)
                  </label>
                  <input
                    {...register('skills')}
                    className="input"
                    placeholder="JavaScript, React, Node.js, MongoDB"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate skills with commas. These will be used for AI matching.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requirements (one per line)
                    </label>
                    <textarea
                      {...register('requirements')}
                      rows={5}
                      className="input resize-none"
                      placeholder="Bachelor's degree in Computer Science&#10;3+ years of experience&#10;Strong communication skills"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsibilities (one per line)
                    </label>
                    <textarea
                      {...register('responsibilities')}
                      rows={5}
                      className="input resize-none"
                      placeholder="Develop and maintain web applications&#10;Collaborate with cross-functional teams&#10;Code reviews and mentoring"
                    />
                  </div>
                </div>
              </div>

              {/* Compensation & Benefits */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Compensation & Benefits</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Salary
                    </label>
                    <input
                      {...register('salaryMin')}
                      type="number"
                      className="input"
                      placeholder="80000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Salary
                    </label>
                    <input
                      {...register('salaryMax')}
                      type="number"
                      className="input"
                      placeholder="120000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary Period
                    </label>
                    <select
                      {...register('salaryPeriod')}
                      className="input"
                    >
                      <option value="yearly">Yearly</option>
                      <option value="monthly">Monthly</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benefits (comma-separated)
                  </label>
                  <input
                    {...register('benefits')}
                    className="input"
                    placeholder="Health insurance, 401k, Remote work, Flexible hours"
                  />
                </div>
              </div>

              {/* Application Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Application Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Deadline
                    </label>
                    <input
                      {...register('applicationDeadline')}
                      type="date"
                      className="input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Status
                    </label>
                    <select
                      {...register('status')}
                      className="input"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowJobForm(false)}
                  className="btn btn-secondary btn-md"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={createJobMutation.isLoading || updateJobMutation.isLoading}
                  className="btn btn-primary btn-md"
                >
                  {(createJobMutation.isLoading || updateJobMutation.isLoading) ? (
                    <div className="loading-spinner w-4 h-4 mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingJob ? 'Update Job' : 'Post Job'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default JobManagement;
