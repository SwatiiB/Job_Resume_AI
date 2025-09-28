import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'react-query';
import { 
  Users, 
  Search, 
  Filter, 
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
  TrendingUp,
  Phone,
  ExternalLink,
  Send,
  Clock,
  CheckCircle2
} from 'lucide-react';

import { jobsAPI, aiAPI, notificationsAPI } from '../../services/api';
import { cn } from '../../utils/cn';
import { 
  getMatchScoreColor, 
  formatRelativeTime, 
  truncateText 
} from '../../utils/formatters';
import CandidateCard from './CandidateCard';

const CandidateMatches = ({ myJobs }) => {
  const [selectedJob, setSelectedJob] = useState(myJobs?.[0] || null);
  const [filters, setFilters] = useState({
    minMatchScore: 50,
    skills: '',
    location: '',
    experience: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());

  // Fetch candidate matches for selected job
  const { data: candidateMatches, isLoading, refetch } = useQuery(
    ['candidate-matches', selectedJob?._id],
    () => aiAPI.getCandidateRecommendations(selectedJob._id, filters, 50),
    {
      enabled: !!selectedJob,
      select: (response) => response.data,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Send notification mutation
  const sendNotificationMutation = useMutation(
    ({ candidateId, type, data }) => notificationsAPI.sendJobMatchNotification(candidateId, type, data),
    {
      onSuccess: () => {
        toast.success('Notification sent successfully!');
      },
      onError: (error) => {
        toast.error('Failed to send notification');
      },
    }
  );

  const candidates = candidateMatches?.matches || [];
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = !searchTerm || 
      candidate.candidate.profile.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.candidate.profile.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMinScore = candidate.overallScore >= filters.minMatchScore;
    
    return matchesSearch && matchesMinScore;
  });

  const handleSendJobMatch = (candidate) => {
    if (!selectedJob) return;

    const notificationData = {
      candidateId: candidate.candidate.id,
      type: 'job_match',
      data: {
        jobTitle: selectedJob.title,
        companyName: selectedJob.company.name,
        matchScore: candidate.overallScore,
        jobId: selectedJob._id
      }
    };

    sendNotificationMutation.mutate(notificationData);
  };

  const handleBulkNotify = () => {
    if (selectedCandidates.size === 0) {
      toast.error('Please select candidates to notify');
      return;
    }

    selectedCandidates.forEach(candidateId => {
      const candidate = candidates.find(c => c.candidate.id === candidateId);
      if (candidate) {
        handleSendJobMatch(candidate);
      }
    });

    setSelectedCandidates(new Set());
  };

  const handleSelectCandidate = (candidateId) => {
    const newSelected = new Set(selectedCandidates);
    if (selectedCandidates.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidates(newSelected);
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
      {/* Job Selection */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Job to View Candidates</h3>
          <div className="text-sm text-gray-500">
            {myJobs?.length || 0} active jobs
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myJobs?.map((job) => (
            <motion.button
              key={job._id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedJob(job)}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                selectedJob?._id === job._id
                  ? "border-accent-500 bg-accent-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 truncate">{job.title}</h4>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  job.status === 'active' ? "bg-success-100 text-success-700" : "bg-gray-100 text-gray-700"
                )}>
                  {job.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{job.location.city}, {job.location.state}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{job.applicationCount || 0} applications</span>
                <span>{formatRelativeTime(job.createdAt)}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Candidate Matching Section */}
      {selectedJob && (
        <>
          {/* Filters and Search */}
          <motion.div variants={cardVariants} className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Candidates for "{selectedJob.title}"
                </h3>
                <p className="text-gray-600 mt-1">
                  {candidates.length} AI-ranked candidates • {filteredCandidates.length} shown
                </p>
              </div>
              
              {selectedCandidates.size > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkNotify}
                  className="btn btn-primary btn-md"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Notify {selectedCandidates.size} Candidates
                </motion.button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input"
                />
              </div>

              <input
                type="text"
                placeholder="Skills filter"
                value={filters.skills}
                onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
                className="input"
              />

              <input
                type="text"
                placeholder="Location filter"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="input"
              />

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

          {/* Candidate Summary Stats */}
          <motion.div variants={cardVariants} className="dashboard-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{candidates.length}</div>
                <div className="text-sm text-gray-600">Total Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">
                  {candidates.filter(c => c.overallScore >= 80).length}
                </div>
                <div className="text-sm text-gray-600">Excellent (80%+)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-600">
                  {candidates.filter(c => c.overallScore >= 60 && c.overallScore < 80).length}
                </div>
                <div className="text-sm text-gray-600">Good (60-79%)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-600">
                  {Math.round(candidates.reduce((sum, c) => sum + c.overallScore, 0) / candidates.length) || 0}%
                </div>
                <div className="text-sm text-gray-600">Avg Match</div>
              </div>
            </div>
          </motion.div>

          {/* Candidates List */}
          {isLoading ? (
            <motion.div variants={cardVariants} className="dashboard-card">
              <div className="text-center py-12">
                <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
                <p className="text-gray-600">Finding the best candidates for this role...</p>
              </div>
            </motion.div>
          ) : filteredCandidates.length > 0 ? (
            <div className="space-y-4">
              {filteredCandidates.map((candidateMatch, index) => (
                <CandidateCard
                  key={candidateMatch.candidate.id}
                  candidateMatch={candidateMatch}
                  job={selectedJob}
                  index={index}
                  isSelected={selectedCandidates.has(candidateMatch.candidate.id)}
                  onSelect={handleSelectCandidate}
                  onSendNotification={handleSendJobMatch}
                />
              ))}
            </div>
          ) : (
            <motion.div variants={cardVariants} className="dashboard-card">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Candidates</h3>
                <p className="text-gray-600 mb-6">
                  {candidates.length === 0 
                    ? 'No candidates found for this job yet. Try adjusting the job requirements or wait for more candidates to join.'
                    : 'No candidates match your current filters. Try lowering the match score threshold or adjusting other filters.'
                  }
                </p>
                {candidates.length > 0 && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, minMatchScore: 30 }))}
                    className="btn btn-secondary btn-md"
                  >
                    Lower Match Threshold
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Matching Insights */}
          {candidates.length > 0 && (
            <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-accent-50 to-accent-100 border-accent-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-accent-900 mb-2">AI Matching Insights</h4>
                  <div className="space-y-2 text-sm text-accent-800">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <span>
                        Average match score: {Math.round(candidates.reduce((sum, c) => sum + c.overallScore, 0) / candidates.length)}%
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      <span>
                        Top skills needed: {selectedJob.skills?.slice(0, 3).join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>
                        {candidates.filter(c => c.overallScore >= 80).length} excellent matches available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* No Job Selected State */}
      {!selectedJob && (
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Job to View Candidates</h3>
            <p className="text-gray-600 mb-6">
              Choose one of your active job postings to see AI-ranked candidate matches.
            </p>
            {myJobs?.length === 0 && (
              <p className="text-gray-600">
                You need to post a job first to see candidate matches.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CandidateMatches;
