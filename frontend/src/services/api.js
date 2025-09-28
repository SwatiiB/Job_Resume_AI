import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
            refreshToken
          });

          const { token, refreshToken: newRefreshToken } = response.data;
          
          // Update stored tokens
          Cookies.set('auth_token', token, { expires: 1/48 }); // 30 minutes
          Cookies.set('refresh_token', newRefreshToken, { expires: 7 }); // 7 days

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('auth_token');
        Cookies.remove('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You don\'t have permission for this action.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => {
    // Handle both regular JSON and FormData
    const isFormData = userData instanceof FormData;
    return api.post('/auth/register', userData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
    });
  },
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
  getMe: () => api.get('/auth/me'),
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  getProfileCompletion: () => api.get('/users/profile/completion'),
  updatePreferences: (preferences) => api.put('/users/preferences', preferences),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAvatar: () => api.delete('/users/avatar'),
  deactivateAccount: () => api.put('/users/deactivate'),
  searchUsers: (params) => api.get('/users/search', { params }),
};

// Jobs API
export const jobsAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJobById: (jobId) => api.get(`/jobs/${jobId}`),
  searchJobs: (params) => api.get('/jobs/search', { params }),
  getFeaturedJobs: (params) => api.get('/jobs/featured', { params }),
  getMyApplications: (params) => api.get('/jobs/my-applications', { params }),
  applyToJob: (jobId, applicationData) => api.post(`/jobs/${jobId}/apply`, applicationData),
  createJob: (jobData) => api.post('/jobs', jobData),
  updateJob: (jobId, jobData) => api.put(`/jobs/${jobId}`, jobData),
  deleteJob: (jobId) => api.delete(`/jobs/${jobId}`),
  getMyJobs: (params) => api.get('/jobs/my-jobs', { params }),
  getJobApplications: (jobId, params) => api.get(`/jobs/${jobId}/applications`, { params }),
  updateApplicationStatus: (jobId, candidateId, statusData) => 
    api.put(`/jobs/${jobId}/applications/${candidateId}/status`, statusData),
  getJobStats: (jobId) => api.get(`/jobs/${jobId}/stats`),
};

// Resumes API
export const resumesAPI = {
  uploadResume: (formData) => api.post('/resumes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyResumes: (params) => api.get('/resumes', { params }),
  getResumeById: (resumeId) => api.get(`/resumes/${resumeId}`),
  updateResume: (resumeId, resumeData) => api.put(`/resumes/${resumeId}`, resumeData),
  deleteResume: (resumeId) => api.delete(`/resumes/${resumeId}`),
  downloadResume: (resumeId) => api.get(`/resumes/${resumeId}/download`, {
    responseType: 'blob'
  }),
  parseResume: (resumeId) => api.post(`/resumes/${resumeId}/parse`),
  getResumeAnalysis: (resumeId) => api.get(`/resumes/${resumeId}/analysis`),
  getAISuggestions: (resumeId) => api.get(`/resumes/${resumeId}/suggestions`),
  applySuggestion: (resumeId, suggestionId) => 
    api.post(`/resumes/${resumeId}/suggestions/${suggestionId}/apply`),
  exportResume: (resumeId, exportData) => api.post(`/resumes/${resumeId}/export`, exportData),
  setActiveResume: (resumeId) => api.post(`/resumes/${resumeId}/set-active`),
  getResumeVersions: (userId) => api.get(`/resumes/versions/${userId}`),
  compareResumes: (resumeId1, resumeId2) => api.get(`/resumes/compare/${resumeId1}/${resumeId2}`),
  searchResumes: (params) => api.get('/resumes/search', { params }),
};

// AI API
export const aiAPI = {
  getHealthStatus: () => api.get('/ai/health'),
  generateEmbedding: (text) => api.post('/ai/embedding', { text }),
  matchResumeToJob: (resumeId, jobId) => api.post('/ai/match/resume-to-job', { resumeId, jobId }),
  getJobRecommendations: (resumeId, filters = {}, limit = 10) => 
    api.post('/ai/match/job-recommendations', { resumeId, filters, limit }),
  getCandidateRecommendations: (jobId, filters = {}, limit = 10) => 
    api.post('/ai/match/candidate-recommendations', { jobId, filters, limit }),
  analyzeResume: (resumeId) => api.post('/ai/analyze/resume', { resumeId }),
  getResumeSuggestions: (resumeId) => api.post('/ai/suggestions/resume', { resumeId }),
  optimizeResumeForJob: (resumeId, jobId) => 
    api.post('/ai/optimize/resume-for-job', { resumeId, jobId }),
  extractSkills: (resumeId, content) => api.post('/ai/extract/skills', { resumeId, content }),
  optimizeJobDescription: (jobId, description) => 
    api.post('/ai/optimize/job-description', { jobId, description }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getNotificationPreferences: () => api.get('/notifications/preferences'),
  updateNotificationPreferences: (preferences) => 
    api.put('/notifications/preferences', preferences),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  handleAMPProfileUpdate: (formData) => api.post('/notifications/amp/profile-update', formData),
  unsubscribe: (token) => api.get(`/notifications/unsubscribe/${token}`),
  
  // Admin endpoints
  getAllNotifications: (params) => api.get('/notifications/admin/all', { params }),
  getNotificationStats: (params) => api.get('/notifications/admin/stats', { params }),
  sendTestNotification: (testData) => api.post('/notifications/admin/test', testData),
  getQueueStatus: () => api.get('/notifications/admin/queue/status'),
  retryAllFailed: () => api.post('/notifications/admin/retry-all'),
  retryNotification: (notificationId) => 
    api.post(`/notifications/admin/${notificationId}/retry`),
  pauseQueue: () => api.post('/notifications/admin/queue/pause'),
  resumeQueue: () => api.post('/notifications/admin/queue/resume'),
  getCronStatus: () => api.get('/notifications/admin/cron/status'),
  triggerCronJob: (jobName) => api.post(`/notifications/admin/cron/${jobName}/trigger`),
};

// Basic Admin API (extended below)
const basicAdminAPI = {
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`),
  getSystemStats: () => api.get('/admin/stats'),
  getSystemHealth: () => api.get('/admin/health'),
};

// Utility functions for API calls
export const handleAPIError = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const handleAPISuccess = (response) => {
  if (response.data?.message) {
    toast.success(response.data.message);
  }
  return response.data;
};

// File upload helper
export const uploadFile = async (file, endpoint, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

// Download file helper
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    toast.success('File downloaded successfully');
  } catch (error) {
    toast.error('Failed to download file');
    throw error;
  }
};

// Complete Admin API (merging with basic admin API)
export const adminAPI = {
  // Basic admin functions
  ...basicAdminAPI,
  
  // System monitoring
  getSystemStats: () => api.get('/admin/system/stats'),
  getSystemHealth: () => api.get('/admin/system/health'),
  getRecentActivity: (params) => api.get('/admin/system/activity', { params }),
  getSystemAnalytics: (params) => api.get('/admin/analytics', { params }),
  
  // Enhanced user management
  activateUser: (userId) => api.put(`/admin/users/${userId}/activate`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  resetUserPassword: (userId) => api.post(`/admin/users/${userId}/reset-password`),
  bulkUserAction: (action, userIds) => api.post('/admin/users/bulk', { action, userIds }),
  
  // Job monitoring
  getAllJobs: (params) => api.get('/admin/jobs', { params }),
  approveJob: (jobId) => api.put(`/admin/jobs/${jobId}/approve`),
  rejectJob: (jobId, reason) => api.put(`/admin/jobs/${jobId}/reject`, { reason }),
  flagJob: (jobId, reason) => api.put(`/admin/jobs/${jobId}/flag`, { reason }),
  deleteJob: (jobId) => api.delete(`/admin/jobs/${jobId}`),
  bulkJobAction: (action, jobIds, reason) => api.post('/admin/jobs/bulk', { action, jobIds, reason }),
  
  // Notification management
  getNotificationLogs: (params) => api.get('/admin/notifications', { params }),
  getNotificationStats: () => api.get('/admin/notifications/stats'),
  getQueueStatus: () => api.get('/admin/notifications/queue/status'),
  retryNotification: (notificationId) => api.post(`/admin/notifications/${notificationId}/retry`),
  retryAllFailedNotifications: () => api.post('/admin/notifications/retry-all-failed'),
  deleteNotification: (notificationId) => api.delete(`/admin/notifications/${notificationId}`),
  bulkNotificationAction: (action, notificationIds) => api.post('/admin/notifications/bulk', { action, notificationIds }),
  
  // System settings
  getSystemSettings: () => api.get('/admin/settings'),
  updateSystemSettings: (settings) => api.put('/admin/settings', settings),
  getFeatureFlags: () => api.get('/admin/feature-flags'),
  toggleFeatureFlag: (flagName, enabled) => api.put(`/admin/feature-flags/${flagName}`, { enabled }),
  
  // CRON jobs
  getCronJobs: () => api.get('/admin/cron-jobs'),
  toggleCronJob: (jobName, enabled) => api.put(`/admin/cron-jobs/${jobName}`, { enabled }),
  runCronJob: (jobName) => api.post(`/admin/cron-jobs/${jobName}/run`),
  
  // System maintenance
  clearSystemCache: () => api.post('/admin/maintenance/clear-cache'),
  optimizeDatabase: () => api.post('/admin/maintenance/optimize-database'),
  downloadLogs: () => api.get('/admin/maintenance/logs/download'),
  clearLogs: () => api.delete('/admin/maintenance/logs'),
};

export default api;
