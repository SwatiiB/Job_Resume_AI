import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Star,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

import { resumesAPI, aiAPI } from '../../services/api';
import { cn } from '../../utils/cn';
import { 
  formatFileSize, 
  formatRelativeTime, 
  getATSGrade, 
  formatPercentage 
} from '../../utils/formatters';

const ResumeUpload = ({ resumes, refetchResumes }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedResume, setSelectedResume] = useState(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get active resume
  const activeResume = resumes?.find(r => r.isActive) || resumes?.[0];

  // Fetch resume analysis
  const { data: resumeAnalysis, refetch: refetchAnalysis } = useQuery(
    ['resume-analysis', selectedResume?._id],
    () => resumesAPI.getResumeAnalysis(selectedResume._id),
    {
      enabled: !!selectedResume,
      select: (response) => response.data.data,
    }
  );

  // Upload mutation
  const uploadMutation = useMutation(
    (formData) => resumesAPI.uploadResume(formData),
    {
      onSuccess: () => {
        toast.success('Resume uploaded successfully!');
        refetchResumes();
        setUploadProgress(0);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Upload failed');
        setUploadProgress(0);
      },
    }
  );

  // Set active resume mutation
  const setActiveMutation = useMutation(
    (resumeId) => resumesAPI.setActiveResume(resumeId),
    {
      onSuccess: () => {
        toast.success('Active resume updated!');
        refetchResumes();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update active resume');
      },
    }
  );

  // Delete resume mutation
  const deleteMutation = useMutation(
    (resumeId) => resumesAPI.deleteResume(resumeId),
    {
      onSuccess: () => {
        toast.success('Resume deleted successfully!');
        refetchResumes();
        if (selectedResume?._id === resumeId) {
          setSelectedResume(null);
          setAnalysisOpen(false);
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete resume');
      },
    }
  );

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    uploadMutation.mutate(formData);
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleDownload = async (resume) => {
    try {
      const response = await resumesAPI.downloadResume(resume._id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded!');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const handleAnalyze = (resume) => {
    setSelectedResume(resume);
    setAnalysisOpen(true);
    refetchAnalysis();
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
      {/* Upload Section */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Resume</h3>
        
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
            isDragActive
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:border-primary-400 hover:bg-gray-50",
            uploadMutation.isLoading && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />
          
          <motion.div
            animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload className={cn(
              "w-12 h-12 mx-auto mb-4",
              isDragActive ? "text-primary-500" : "text-gray-400"
            )} />
            
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragActive ? "Drop your resume here" : "Upload your resume"}
            </h4>
            
            <p className="text-gray-600 mb-4">
              Drag and drop your resume file here, or click to browse
            </p>
            
            <div className="text-sm text-gray-500">
              Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
            </div>
          </motion.div>

          {uploadMutation.isLoading && (
            <div className="mt-4">
              <div className="progress h-2 bg-gray-200">
                <motion.div
                  className="progress-bar h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Resume List */}
      {resumes && resumes.length > 0 && (
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Your Resumes</h3>
            <div className="text-sm text-gray-500">
              {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-4">
            {resumes.map((resume, index) => {
              const atsGrade = getATSGrade(resume.atsScore || 0);
              
              return (
                <motion.div
                  key={resume._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 border rounded-xl hover:shadow-medium transition-all",
                    resume.isActive 
                      ? "border-primary-200 bg-primary-50/50" 
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {resume.originalName}
                          </h4>
                          {resume.isActive && (
                            <span className="px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                          <span>{formatFileSize(resume.fileSize)}</span>
                          <span>•</span>
                          <span>Uploaded {formatRelativeTime(resume.createdAt)}</span>
                          {resume.atsScore > 0 && (
                            <>
                              <span>•</span>
                              <span className={atsGrade.color}>
                                ATS Score: {resume.atsScore}% ({atsGrade.grade})
                              </span>
                            </>
                          )}
                        </div>

                        {/* Resume stats */}
                        <div className="flex items-center space-x-4 text-xs">
                          {resume.viewCount > 0 && (
                            <div className="flex items-center text-gray-500">
                              <Eye className="w-3 h-3 mr-1" />
                              {resume.viewCount} views
                            </div>
                          )}
                          {resume.downloadCount > 0 && (
                            <div className="flex items-center text-gray-500">
                              <Download className="w-3 h-3 mr-1" />
                              {resume.downloadCount} downloads
                            </div>
                          )}
                          {resume.aiSuggestions?.length > 0 && (
                            <div className="flex items-center text-primary-600">
                              <Lightbulb className="w-3 h-3 mr-1" />
                              {resume.aiSuggestions.length} suggestions
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAnalyze(resume)}
                        className="p-2 text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                        title="Analyze Resume"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDownload(resume)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download Resume"
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>
                      
                      {!resume.isActive && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveMutation.mutate(resume._id)}
                          className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                          title="Set as Active"
                        >
                          <Star className="w-4 h-4" />
                        </motion.button>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this resume?')) {
                            deleteMutation.mutate(resume._id);
                          }
                        }}
                        className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                        title="Delete Resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Active Resume Analysis */}
      {activeResume && (
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Resume Analysis</h3>
            <button
              onClick={() => handleAnalyze(activeResume)}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Analysis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ATS Score */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f97316"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ 
                      strokeDashoffset: 2 * Math.PI * 40 * (1 - (activeResume.atsScore || 0) / 100)
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">
                    {activeResume.atsScore || 0}
                  </span>
                </div>
              </div>
              <h4 className="font-semibold text-gray-900">ATS Score</h4>
              <p className="text-sm text-gray-600">
                {getATSGrade(activeResume.atsScore || 0).grade} Grade
              </p>
            </div>

            {/* Keyword Score */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-secondary-100 to-secondary-200 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-secondary-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Keywords</h4>
              <p className="text-sm text-gray-600">
                {activeResume.keywords?.length || 0} found
              </p>
            </div>

            {/* Suggestions */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-accent-100 to-accent-200 rounded-full flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-accent-600" />
              </div>
              <h4 className="font-semibold text-gray-900">AI Suggestions</h4>
              <p className="text-sm text-gray-600">
                {activeResume.aiSuggestions?.length || 0} improvements
              </p>
            </div>
          </div>

          {/* Quick Analysis Summary */}
          {activeResume.atsScore > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Quick Summary</h4>
                <button
                  onClick={() => handleAnalyze(activeResume)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Details
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">File Format:</span>
                  <span className="ml-2 font-medium">
                    {activeResume.mimeType === 'application/pdf' ? 'PDF ✓' : 'Not PDF ⚠️'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Parsing:</span>
                  <span className="ml-2 font-medium">
                    {activeResume.parsedContent?.parsingStatus === 'completed' ? 'Success ✓' : 'Processing...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Resume Analysis Modal */}
      {analysisOpen && selectedResume && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setAnalysisOpen(false)}
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
                  <h2 className="text-xl font-semibold text-gray-900">Resume Analysis</h2>
                  <p className="text-gray-600 mt-1">{selectedResume.originalName}</p>
                </div>
                <button
                  onClick={() => setAnalysisOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {resumeAnalysis ? (
                <div className="space-y-6">
                  {/* Scores Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-primary-50 rounded-lg">
                      <div className="text-3xl font-bold text-primary-600 mb-2">
                        {resumeAnalysis.atsScore || 0}
                      </div>
                      <div className="text-sm font-medium text-gray-900">ATS Score</div>
                      <div className="text-xs text-gray-600">
                        {getATSGrade(resumeAnalysis.atsScore || 0).grade}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-secondary-50 rounded-lg">
                      <div className="text-3xl font-bold text-secondary-600 mb-2">
                        {resumeAnalysis.extractedSkills?.length || 0}
                      </div>
                      <div className="text-sm font-medium text-gray-900">Skills Found</div>
                      <div className="text-xs text-gray-600">Technical & Soft</div>
                    </div>

                    <div className="text-center p-4 bg-accent-50 rounded-lg">
                      <div className="text-3xl font-bold text-accent-600 mb-2">
                        {resumeAnalysis.suggestions?.length || 0}
                      </div>
                      <div className="text-sm font-medium text-gray-900">Suggestions</div>
                      <div className="text-xs text-gray-600">AI Recommendations</div>
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  {resumeAnalysis.suggestions && resumeAnalysis.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        AI Improvement Suggestions
                      </h4>
                      <div className="space-y-3">
                        {resumeAnalysis.suggestions.slice(0, 5).map((suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-start p-4 bg-gray-50 rounded-lg"
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5",
                              suggestion.priority === 'critical' ? "bg-error-100 text-error-600" :
                              suggestion.priority === 'high' ? "bg-warning-100 text-warning-600" :
                              suggestion.priority === 'medium' ? "bg-primary-100 text-primary-600" :
                              "bg-gray-100 text-gray-600"
                            )}>
                              <Lightbulb className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">
                                {suggestion.title}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {suggestion.description}
                              </p>
                              <div className="flex items-center mt-2 space-x-3">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  suggestion.priority === 'critical' ? "bg-error-100 text-error-700" :
                                  suggestion.priority === 'high' ? "bg-warning-100 text-warning-700" :
                                  suggestion.priority === 'medium' ? "bg-primary-100 text-primary-700" :
                                  "bg-gray-100 text-gray-700"
                                )}>
                                  {suggestion.priority} priority
                                </span>
                                <span className="text-xs text-gray-500">
                                  {suggestion.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Resume</h3>
                  <p className="text-gray-600 mb-6">
                    Our AI is analyzing your resume for ATS compatibility and improvements.
                  </p>
                  <div className="loading-spinner w-8 h-8 mx-auto" />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Empty State */}
      {(!resumes || resumes.length === 0) && !uploadMutation.isLoading && (
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded yet</h3>
            <p className="text-gray-600 mb-6">
              Upload your resume to get started with AI-powered analysis and job matching.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center p-3 bg-primary-50 rounded-lg">
                  <Zap className="w-5 h-5 text-primary-600 mr-2" />
                  <span className="text-primary-700">AI Analysis</span>
                </div>
                <div className="flex items-center p-3 bg-secondary-50 rounded-lg">
                  <Target className="w-5 h-5 text-secondary-600 mr-2" />
                  <span className="text-secondary-700">ATS Optimization</span>
                </div>
                <div className="flex items-center p-3 bg-accent-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-accent-600 mr-2" />
                  <span className="text-accent-700">Job Matching</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ResumeUpload;
