import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { 
  Settings, 
  Shield, 
  Database,
  Server,
  Bell,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Key,
  Lock,
  Unlock,
  Activity,
  Zap,
  Code,
  Globe,
  Mail,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

import { adminAPI, authAPI } from '../../services/api';
import { cn } from '../../utils/cn';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const queryClient = useQueryClient();

  // Fetch system settings
  const { data: systemSettings, refetch: refetchSettings } = useQuery(
    'admin-system-settings',
    adminAPI.getSystemSettings,
    {
      select: (response) => response.data.data,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch feature flags
  const { data: featureFlags, refetch: refetchFeatureFlags } = useQuery(
    'admin-feature-flags',
    adminAPI.getFeatureFlags,
    {
      select: (response) => response.data.data,
      staleTime: 2 * 60 * 1000,
    }
  );

  // Fetch cron jobs
  const { data: cronJobs, refetch: refetchCronJobs } = useQuery(
    'admin-cron-jobs',
    adminAPI.getCronJobs,
    {
      select: (response) => response.data.data,
      staleTime: 30 * 1000,
    }
  );

  // Settings form
  const { 
    register: registerSettings, 
    handleSubmit: handleSettingsSubmit, 
    formState: { errors: settingsErrors },
    reset: resetSettings
  } = useForm({
    defaultValues: systemSettings || {}
  });

  // Password form
  const { 
    register: registerPassword, 
    handleSubmit: handlePasswordSubmit, 
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch
  } = useForm();

  // Update system settings mutation
  const updateSettingsMutation = useMutation(
    (settings) => adminAPI.updateSystemSettings(settings),
    {
      onSuccess: () => {
        toast.success('System settings updated successfully');
        refetchSettings();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update settings');
      },
    }
  );

  // Toggle feature flag mutation
  const toggleFeatureFlagMutation = useMutation(
    ({ flagName, enabled }) => adminAPI.toggleFeatureFlag(flagName, enabled),
    {
      onSuccess: () => {
        toast.success('Feature flag updated successfully');
        refetchFeatureFlags();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update feature flag');
      },
    }
  );

  // Cron job mutations
  const toggleCronJobMutation = useMutation(
    ({ jobName, enabled }) => adminAPI.toggleCronJob(jobName, enabled),
    {
      onSuccess: () => {
        toast.success('Cron job updated successfully');
        refetchCronJobs();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update cron job');
      },
    }
  );

  const runCronJobMutation = useMutation(
    (jobName) => adminAPI.runCronJob(jobName),
    {
      onSuccess: () => {
        toast.success('Cron job executed successfully');
        refetchCronJobs();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to run cron job');
      },
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    (passwordData) => authAPI.changePassword(passwordData),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        setShowPasswordForm(false);
        resetPassword();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to change password');
      },
    }
  );

  // System maintenance mutations
  const clearCacheMutation = useMutation(
    () => adminAPI.clearSystemCache(),
    {
      onSuccess: () => {
        toast.success('System cache cleared successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to clear cache');
      },
    }
  );

  const optimizeDatabaseMutation = useMutation(
    () => adminAPI.optimizeDatabase(),
    {
      onSuccess: () => {
        toast.success('Database optimization completed');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to optimize database');
      },
    }
  );

  const handleSettingsUpdate = (data) => {
    updateSettingsMutation.mutate(data);
  };

  const handlePasswordChange = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };

  const handleFeatureToggle = (flagName, enabled) => {
    toggleFeatureFlagMutation.mutate({ flagName, enabled });
  };

  const handleCronJobToggle = (jobName, enabled) => {
    toggleCronJobMutation.mutate({ jobName, enabled });
  };

  const tabs = [
    { id: 'general', name: 'General Settings', icon: Settings },
    { id: 'features', name: 'Feature Flags', icon: Zap },
    { id: 'cron', name: 'Scheduled Jobs', icon: Clock },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'maintenance', name: 'Maintenance', icon: Server }
  ];

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
      {/* Admin Settings Header */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Admin Controls</h3>
            <p className="text-gray-600 mt-1">System configuration and administrative settings</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm text-gray-600">System Operational</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    isActive
                      ? "border-error-500 text-error-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'general' && (
          <motion.div variants={cardVariants} className="dashboard-card">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">General System Settings</h4>
            
            <form onSubmit={handleSettingsSubmit(handleSettingsUpdate)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Name
                  </label>
                  <input
                    {...registerSettings('platformName')}
                    className="input"
                    defaultValue="Resume Refresh Platform"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Support Email
                  </label>
                  <input
                    {...registerSettings('supportEmail')}
                    type="email"
                    className="input"
                    defaultValue="support@resumerefresh.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max File Size (MB)
                  </label>
                  <input
                    {...registerSettings('maxFileSize')}
                    type="number"
                    className="input"
                    defaultValue="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    {...registerSettings('sessionTimeout')}
                    type="number"
                    className="input"
                    defaultValue="60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Message
                </label>
                <textarea
                  {...registerSettings('maintenanceMessage')}
                  rows={3}
                  className="input resize-none"
                  placeholder="System will be down for maintenance..."
                />
              </div>

              <div className="flex items-center justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={updateSettingsMutation.isLoading}
                  className="btn btn-primary btn-md"
                >
                  {updateSettingsMutation.isLoading ? (
                    <div className="loading-spinner w-4 h-4 mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Settings
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'features' && (
          <motion.div variants={cardVariants} className="dashboard-card">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Feature Flags</h4>
            
            <div className="space-y-4">
              {[
                {
                  name: 'aiMatching',
                  label: 'AI-Powered Matching',
                  description: 'Enable intelligent candidate-job matching using AI algorithms',
                  enabled: featureFlags?.aiMatching ?? true,
                  category: 'AI Features'
                },
                {
                  name: 'resumeRefresh',
                  label: 'Resume Refresh Emails',
                  description: 'Send interactive AMP emails for resume optimization',
                  enabled: featureFlags?.resumeRefresh ?? true,
                  category: 'Email Features'
                },
                {
                  name: 'advancedAnalytics',
                  label: 'Advanced Analytics',
                  description: 'Detailed analytics and reporting for all users',
                  enabled: featureFlags?.advancedAnalytics ?? false,
                  category: 'Analytics'
                },
                {
                  name: 'bulkOperations',
                  label: 'Bulk Operations',
                  description: 'Allow bulk actions on users, jobs, and notifications',
                  enabled: featureFlags?.bulkOperations ?? true,
                  category: 'Admin Tools'
                },
                {
                  name: 'realTimeNotifications',
                  label: 'Real-time Notifications',
                  description: 'WebSocket-based real-time notifications',
                  enabled: featureFlags?.realTimeNotifications ?? false,
                  category: 'Notifications'
                },
                {
                  name: 'betaFeatures',
                  label: 'Beta Features',
                  description: 'Enable experimental features for testing',
                  enabled: featureFlags?.betaFeatures ?? false,
                  category: 'Experimental'
                }
              ].map((feature) => (
                <div key={feature.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="font-medium text-gray-900">{feature.label}</h5>
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                        {feature.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={feature.enabled}
                      onChange={(e) => handleFeatureToggle(feature.name, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-error-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-error-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'cron' && (
          <motion.div variants={cardVariants} className="dashboard-card">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Scheduled Jobs (CRON)</h4>
            
            <div className="space-y-4">
              {[
                {
                  name: 'weeklyResumeRefresh',
                  label: 'Weekly Resume Refresh Reminders',
                  description: 'Send weekly reminders to users with stale profiles',
                  schedule: '0 9 * * 1',
                  enabled: cronJobs?.weeklyResumeRefresh?.enabled ?? true,
                  lastRun: cronJobs?.weeklyResumeRefresh?.lastRun,
                  nextRun: cronJobs?.weeklyResumeRefresh?.nextRun
                },
                {
                  name: 'dailyJobMatching',
                  label: 'Daily Job Matching',
                  description: 'Run AI matching for new jobs and notify candidates',
                  schedule: '0 10 * * *',
                  enabled: cronJobs?.dailyJobMatching?.enabled ?? true,
                  lastRun: cronJobs?.dailyJobMatching?.lastRun,
                  nextRun: cronJobs?.dailyJobMatching?.nextRun
                },
                {
                  name: 'systemCleanup',
                  label: 'System Cleanup',
                  description: 'Clean up old logs, expired tokens, and temporary files',
                  schedule: '0 2 * * 0',
                  enabled: cronJobs?.systemCleanup?.enabled ?? true,
                  lastRun: cronJobs?.systemCleanup?.lastRun,
                  nextRun: cronJobs?.systemCleanup?.nextRun
                },
                {
                  name: 'analyticsReport',
                  label: 'Weekly Analytics Report',
                  description: 'Generate and send weekly analytics reports to admins',
                  schedule: '0 8 * * 1',
                  enabled: cronJobs?.analyticsReport?.enabled ?? false,
                  lastRun: cronJobs?.analyticsReport?.lastRun,
                  nextRun: cronJobs?.analyticsReport?.nextRun
                }
              ].map((job) => (
                <div key={job.name} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h5 className="font-medium text-gray-900">{job.label}</h5>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        job.enabled ? "bg-success-100 text-success-700" : "bg-gray-100 text-gray-700"
                      )}>
                        {job.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => runCronJobMutation.mutate(job.name)}
                        disabled={runCronJobMutation.isLoading}
                        className="btn btn-secondary btn-sm"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run Now
                      </button>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={job.enabled}
                          onChange={(e) => handleCronJobToggle(job.name, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-error-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-error-500"></div>
                      </label>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{job.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Schedule:</span>
                      <p className="font-mono text-gray-900">{job.schedule}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Run:</span>
                      <p className="text-gray-900">
                        {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Run:</span>
                      <p className="text-gray-900">
                        {job.nextRun ? new Date(job.nextRun).toLocaleString() : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div variants={cardVariants} className="dashboard-card">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h4>
            
            <div className="space-y-6">
              {/* Password Change */}
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="font-semibold text-gray-900">Admin Password</h5>
                    <p className="text-sm text-gray-600 mt-1">
                      Change your administrator password for enhanced security
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </button>
                </div>

                {showPasswordForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handlePasswordSubmit(handlePasswordChange)}
                    className="space-y-4 mt-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('currentPassword', { required: 'Current password is required' })}
                          type={showCurrentPassword ? 'text' : 'password'}
                          className={cn("input pr-10", passwordErrors.currentPassword && "input-error")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-error-600 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('newPassword', { 
                            required: 'New password is required',
                            minLength: {
                              value: 8,
                              message: 'Password must be at least 8 characters'
                            }
                          })}
                          type={showNewPassword ? 'text' : 'password'}
                          className={cn("input pr-10", passwordErrors.newPassword && "input-error")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-error-600 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        {...registerPassword('confirmPassword', { 
                          required: 'Please confirm your password',
                          validate: value => value === watch('newPassword') || 'Passwords do not match'
                        })}
                        type="password"
                        className={cn("input", passwordErrors.confirmPassword && "input-error")}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-error-600 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={changePasswordMutation.isLoading}
                        className="btn btn-primary btn-md"
                      >
                        {changePasswordMutation.isLoading ? (
                          <div className="loading-spinner w-4 h-4 mr-2" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Update Password
                      </motion.button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          resetPassword();
                        }}
                        className="btn btn-secondary btn-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                )}
              </div>

              {/* Security Status */}
              <div className="p-6 bg-success-50 rounded-lg border border-success-200">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-success-600 mt-1" />
                  <div>
                    <h5 className="font-semibold text-success-900 mb-2">Security Status</h5>
                    <div className="space-y-1 text-sm text-success-800">
                      <div>✓ Strong password policy enforced</div>
                      <div>✓ JWT tokens with secure expiration</div>
                      <div>✓ API rate limiting active</div>
                      <div>✓ HTTPS encryption enabled</div>
                      <div>✓ Input validation and sanitization</div>
                      <div>✓ Role-based access control</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'maintenance' && (
          <motion.div variants={cardVariants} className="dashboard-card">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">System Maintenance</h4>
            
            <div className="space-y-6">
              {/* System Operations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Database className="w-6 h-6 text-primary-600 mr-3" />
                    <h5 className="font-semibold text-gray-900">Database Operations</h5>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Optimize database performance and clean up unused data
                  </p>
                  <button
                    onClick={() => optimizeDatabaseMutation.mutate()}
                    disabled={optimizeDatabaseMutation.isLoading}
                    className="btn btn-primary btn-md w-full"
                  >
                    {optimizeDatabaseMutation.isLoading ? (
                      <div className="loading-spinner w-4 h-4 mr-2" />
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    Optimize Database
                  </button>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-4">
                    <RefreshCw className="w-6 h-6 text-secondary-600 mr-3" />
                    <h5 className="font-semibold text-gray-900">Cache Management</h5>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Clear system cache to ensure fresh data delivery
                  </p>
                  <button
                    onClick={() => clearCacheMutation.mutate()}
                    disabled={clearCacheMutation.isLoading}
                    className="btn btn-secondary btn-md w-full"
                  >
                    {clearCacheMutation.isLoading ? (
                      <div className="loading-spinner w-4 h-4 mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Clear Cache
                  </button>
                </div>
              </div>

              {/* System Logs */}
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Activity className="w-6 h-6 text-accent-600 mr-3" />
                    <h5 className="font-semibold text-gray-900">System Logs</h5>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="btn btn-secondary btn-sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download Logs
                    </button>
                    <button className="btn btn-error btn-sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Logs
                    </button>
                  </div>
                </div>
                
                <div className="bg-black rounded-lg p-4 font-mono text-sm text-green-400 max-h-64 overflow-y-auto">
                  <div>[2024-01-15 10:30:15] INFO: System startup completed</div>
                  <div>[2024-01-15 10:30:16] INFO: Database connection established</div>
                  <div>[2024-01-15 10:30:17] INFO: AI services initialized</div>
                  <div>[2024-01-15 10:30:18] INFO: Notification queue started</div>
                  <div>[2024-01-15 10:30:19] INFO: CRON jobs scheduled</div>
                  <div>[2024-01-15 10:35:22] INFO: User authentication successful</div>
                  <div>[2024-01-15 10:36:45] INFO: Job posting created by recruiter</div>
                  <div>[2024-01-15 10:37:12] INFO: AI matching process completed</div>
                  <div>[2024-01-15 10:38:33] WARN: High memory usage detected (85%)</div>
                  <div>[2024-01-15 10:39:01] INFO: Cache cleanup completed</div>
                </div>
              </div>

              {/* Backup & Restore */}
              <div className="p-6 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-warning-600 mt-1" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-warning-900 mb-2">Backup & Restore</h5>
                    <p className="text-sm text-warning-800 mb-4">
                      Create system backups and restore from previous backups. Use with caution.
                    </p>
                    <div className="flex items-center space-x-3">
                      <button className="btn btn-warning btn-md">
                        <Download className="w-4 h-4 mr-2" />
                        Create Backup
                      </button>
                      <button className="btn btn-secondary btn-md">
                        <Upload className="w-4 h-4 mr-2" />
                        Restore Backup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminSettings;
