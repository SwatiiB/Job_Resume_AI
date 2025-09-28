import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star,
  ExternalLink,
  Filter,
  Search,
  Heart,
  BookmarkPlus,
  TrendingUp,
  Users,
  Building,
  Zap,
  Target,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { cn } from '../../utils/cn';
import { 
  formatSalaryRange, 
  formatRelativeTime, 
  getMatchScoreColor,
  formatEmploymentType,
  formatWorkMode,
  truncateText
} from '../../utils/formatters';

const JobRecommendations = ({ jobRecommendations, refetchJobs }) => {
  const [filters, setFilters] = useState({
    location: '',
    employmentType: '',
    workMode: '',
    minSalary: '',
    minMatchScore: 50
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [savedJobs, setSavedJobs] = useState(new Set());

  const jobs = jobRecommendations?.matches || [];
  const totalJobs = jobRecommendations?.totalJobs || 0;
  const matchingJobs = jobRecommendations?.matchingJobs || 0;

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !filters.location || 
      job.job.location.city?.toLowerCase().includes(filters.location.toLowerCase());
    
    const matchesEmploymentType = !filters.employmentType || 
      job.job.employmentType === filters.employmentType;
    
    const matchesWorkMode = !filters.workMode || 
      job.job.location.workMode === filters.workMode;
    
    const matchesMinSalary = !filters.minSalary || 
      (job.job.salary?.min && job.job.salary.min >= parseInt(filters.minSalary));
    
    const matchesMinScore = job.overallScore >= filters.minMatchScore;

    return matchesSearch && matchesLocation && matchesEmploymentType && 
           matchesWorkMode && matchesMinSalary && matchesMinScore;
  });

  const handleSaveJob = (jobId) => {
    const newSavedJobs = new Set(savedJobs);
    if (savedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
    } else {
      newSavedJobs.add(jobId);
    }
    setSavedJobs(newSavedJobs);
  };

  const handleApply = (job) => {
    // This would open the application modal/page
    console.log('Apply to job:', job);
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
      {/* Summary Stats */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">{jobs.length}</div>
            <div className="text-sm text-gray-600">Recommended Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-600 mb-2">{matchingJobs}</div>
            <div className="text-sm text-gray-600">Total Matches</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-600 mb-2">
              {jobs.filter(j => j.overallScore >= 80).length}
            </div>
            <div className="text-sm text-gray-600">Excellent Matches</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600 mb-2">
              {Math.round(jobs.reduce((sum, j) => sum + j.overallScore, 0) / jobs.length) || 0}%
            </div>
            <div className="text-sm text-gray-600">Avg Match Score</div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filter Jobs</h3>
          <button
            onClick={() => {
              setFilters({
                location: '',
                employmentType: '',
                workMode: '',
                minSalary: '',
                minMatchScore: 50
              });
              setSearchTerm('');
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input"
            />
          </div>

          {/* Location */}
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="input"
          />

          {/* Employment Type */}
          <select
            value={filters.employmentType}
            onChange={(e) => setFilters(prev => ({ ...prev, employmentType: e.target.value }))}
            className="input"
          >
            <option value="">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
          </select>

          {/* Work Mode */}
          <select
            value={filters.workMode}
            onChange={(e) => setFilters(prev => ({ ...prev, workMode: e.target.value }))}
            className="input"
          >
            <option value="">All Modes</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>

          {/* Min Salary */}
          <input
            type="number"
            placeholder="Min Salary"
            value={filters.minSalary}
            onChange={(e) => setFilters(prev => ({ ...prev, minSalary: e.target.value }))}
            className="input"
          />

          {/* Min Match Score */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Min Match: {filters.minMatchScore}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minMatchScore}
              onChange={(e) => setFilters(prev => ({ ...prev, minMatchScore: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Job List */}
      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((jobMatch, index) => {
            const { job, overallScore, matchedSkills, missingSkills } = jobMatch;
            const isSaved = savedJobs.has(job.id);
            
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="dashboard-card card-hover"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  {/* Job Info */}
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 hover:text-primary-600 cursor-pointer">
                            {job.title}
                          </h4>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium border",
                            getMatchScoreColor(overallScore)
                          )}>
                            {overallScore}% Match
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {job.company.name}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.location.city}, {job.location.state}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatRelativeTime(job.postedAt)}
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {formatEmploymentType(job.employmentType)}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {formatWorkMode(job.location.workMode)}
                          </span>
                          {job.salary && (
                            <span className="px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
                              {formatSalaryRange(job.salary)}
                            </span>
                          )}
                        </div>

                        {/* Matched Skills */}
                        {matchedSkills && matchedSkills.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-2">Matched Skills:</div>
                            <div className="flex flex-wrap gap-1">
                              {matchedSkills.slice(0, 5).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                              {matchedSkills.length > 5 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{matchedSkills.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Missing Skills */}
                        {missingSkills && missingSkills.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-2">Skills to Develop:</div>
                            <div className="flex flex-wrap gap-1">
                              {missingSkills.slice(0, 3).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-warning-100 text-warning-700 rounded-full text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                              {missingSkills.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{missingSkills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Save Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSaveJob(job.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors ml-4",
                          isSaved 
                            ? "text-error-600 bg-error-50 hover:bg-error-100" 
                            : "text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                        )}
                      >
                        <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn btn-secondary btn-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApply(job)}
                      className={cn(
                        "btn btn-md",
                        overallScore >= 80 ? "btn-success" :
                        overallScore >= 60 ? "btn-primary" :
                        "btn-warning"
                      )}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Apply Now
                    </motion.button>
                  </div>
                </div>

                {/* Match Details Expandable */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 text-primary-500 mr-2" />
                      <span className="text-gray-600">Skills: </span>
                      <span className="font-medium ml-1">{jobMatch.breakdown?.skills || 0}%</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-accent-500 mr-2" />
                      <span className="text-gray-600">Experience: </span>
                      <span className="font-medium ml-1">{jobMatch.breakdown?.experience || 0}%</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-secondary-500 mr-2" />
                      <span className="text-gray-600">Keywords: </span>
                      <span className="font-medium ml-1">{jobMatch.breakdown?.keywords || 0}%</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-success-500 mr-2" />
                      <span className="text-gray-600">Overall: </span>
                      <span className="font-medium ml-1">{overallScore}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="text-center py-12">
            {jobs.length === 0 ? (
              <>
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Recommendations Yet</h3>
                <p className="text-gray-600 mb-6">
                  Upload your resume and complete your profile to get AI-powered job recommendations.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-primary-50 rounded-lg">
                      <CheckCircle2 className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-primary-900">Upload Resume</div>
                      <div className="text-xs text-primary-700 mt-1">AI analyzes your skills</div>
                    </div>
                    <div className="p-4 bg-secondary-50 rounded-lg">
                      <Target className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-secondary-900">Set Preferences</div>
                      <div className="text-xs text-secondary-700 mt-1">Location, salary, type</div>
                    </div>
                    <div className="p-4 bg-accent-50 rounded-lg">
                      <Zap className="w-8 h-8 text-accent-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-accent-900">Get Matches</div>
                      <div className="text-xs text-accent-700 mt-1">AI finds perfect jobs</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Match Your Filters</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters to see more job recommendations.
                </p>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, minMatchScore: 30 }));
                  }}
                  className="btn btn-primary btn-md"
                >
                  Show More Jobs
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Recommendations for Better Matches */}
      {jobs.length > 0 && jobs.filter(j => j.overallScore >= 80).length === 0 && (
        <motion.div variants={cardVariants} className="dashboard-card bg-warning-50 border-warning-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-warning-600 mt-1" />
            <div>
              <h4 className="font-semibold text-warning-900 mb-2">Improve Your Match Scores</h4>
              <p className="text-warning-800 text-sm mb-3">
                Your current matches are below 80%. Here's how to improve:
              </p>
              <ul className="text-sm text-warning-700 space-y-1">
                <li>• Add more relevant skills to your profile</li>
                <li>• Update your work experience with detailed descriptions</li>
                <li>• Complete your education and certification sections</li>
                <li>• Optimize your resume with AI suggestions</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default JobRecommendations;
