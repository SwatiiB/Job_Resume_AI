import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Bell, 
  Mail, 
  Send, 
  RefreshCw,
  Filter,
  Search,
  Calendar,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Settings,
  Play,
  Pause,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { notificationsAPI } from '../../services/api';
import { cn } from '../../utils/cn';
import { 
  formatNotificationTime, 
  formatNotificationType,
  getStatusBadgeProps 
} from '../../utils/formatters';

const RecruiterNotifications = ({ notifications = [] }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const queryClient = useQueryClient();

  // Fetch detailed notifications for recruiter
  const { data: allNotifications, refetch } = useQuery(
    'recruiter-all-notifications',
    () => notificationsAPI.getAllNotifications({ limit: 100 }),
    {
      select: (response) => response.data.data,
      staleTime: 2 * 60 * 1000,
    }
  );

  // Fetch notification stats
  const { data: notificationStats } = useQuery(
    'notification-stats',
    () => notificationsAPI.getNotificationStats(),
    {
      select: (response) => response.data.data,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch queue status
  const { data: queueStatus } = useQuery(
    'queue-status',
    () => notificationsAPI.getQueueStatus(),
    {
      select: (response) => response.data.data,
      staleTime: 30 * 1000, // 30 seconds
    }
  );

  // Retry notification mutation
  const retryMutation = useMutation(
    (notificationId) => notificationsAPI.retryNotification(notificationId),
    {
      onSuccess: () => {
        toast.success('Notification retry initiated');
        refetch();
      },
      onError: (error) => {
        toast.error('Failed to retry notification');
      },
    }
  );

  // Retry all failed mutation
  const retryAllMutation = useMutation(
    () => notificationsAPI.retryAllFailed(),
    {
      onSuccess: (data) => {
        toast.success(`Retried ${data.data.retried} notifications`);
        refetch();
      },
      onError: (error) => {
        toast.error('Failed to retry notifications');
      },
    }
  );

  // Send test notification mutation
  const testNotificationMutation = useMutation(
    (testData) => notificationsAPI.sendTestNotification(testData),
    {
      onSuccess: () => {
        toast.success('Test notification sent successfully');
      },
      onError: (error) => {
        toast.error('Failed to send test notification');
      },
    }
  );

  const displayNotifications = allNotifications || notifications;
  const filteredNotifications = displayNotifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.status === filter || notification.type === filter;
    const matchesSearch = !searchTerm || 
      notification.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.recipientId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getNotificationIcon = (type) => {
    const iconMap = {
      'job_match': Briefcase,
      'interview_scheduled': Calendar,
      'application_status': CheckCircle2,
      'otp_verification': Mail,
      'welcome': Users,
      'password_reset': Settings
    };
    
    return iconMap[type] || Bell;
  };

  const handleRetryNotification = (notificationId) => {
    retryMutation.mutate(notificationId);
  };

  const handleSendTestNotification = () => {
    const testData = {
      type: 'job_match',
      recipientEmail: 'test@example.com',
      templateData: {
        jobTitle: 'Test Position',
        companyName: 'Test Company',
        matchScore: 85
      }
    };
    
    testNotificationMutation.mutate(testData);
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
      {/* Notification System Status */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Notification System Status</h3>
          <button
            onClick={refetch}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600 mb-1">
              {queueStatus?.queue?.stats?.completed || 0}
            </div>
            <div className="text-sm text-gray-600">Sent Successfully</div>
          </div>

          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <div className="text-2xl font-bold text-warning-600 mb-1">
              {queueStatus?.queue?.stats?.waiting || 0}
            </div>
            <div className="text-sm text-gray-600">In Queue</div>
          </div>

          <div className="text-center p-4 bg-error-50 rounded-lg">
            <div className="text-2xl font-bold text-error-600 mb-1">
              {queueStatus?.queue?.stats?.failed || 0}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>

          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <div className="text-2xl font-bold text-accent-600 mb-1">
              {queueStatus?.queue?.stats?.active || 0}
            </div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
        </div>

        {/* Queue Health */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                queueStatus?.queue?.status === 'healthy' ? "bg-success-500" : "bg-error-500"
              )} />
              <span className="font-medium text-gray-900">
                Queue Status: {queueStatus?.queue?.status || 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {queueStatus?.queue?.stats?.failed > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => retryAllMutation.mutate()}
                  disabled={retryAllMutation.isLoading}
                  className="btn btn-warning btn-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry All Failed
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendTestNotification}
                disabled={testNotificationMutation.isLoading}
                className="btn btn-primary btn-sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Test
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notifications Management */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sent Notifications</h3>
            <p className="text-gray-600 mt-1">
              {filteredNotifications.length} of {displayNotifications.length} notifications
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input"
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Notifications</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="job_match">Job Matches</option>
            <option value="interview_scheduled">Interviews</option>
          </select>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type);
              const statusBadge = getStatusBadgeProps(notification.status);
              
              return (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-accent-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {notification.subject}
                        </h4>
                        <span className={cn("badge", statusBadge.className)}>
                          {statusBadge.text}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{formatNotificationType(notification.type)}</span>
                        <span>•</span>
                        <span>To: {notification.recipientId?.email || 'Unknown'}</span>
                        <span>•</span>
                        <span>{formatNotificationTime(notification.createdAt)}</span>
                      </div>

                      {/* Metadata */}
                      {notification.metadata?.matchScore && (
                        <div className="mt-1">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getMatchScoreColor(notification.metadata.matchScore)
                          )}>
                            {notification.metadata.matchScore}% Match
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {notification.status === 'failed' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRetryNotification(notification._id)}
                        disabled={retryMutation.isLoading}
                        className="btn btn-warning btn-sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </motion.button>
                    )}
                    
                    {notification.tracking?.opened && (
                      <div className="flex items-center text-xs text-success-600">
                        <Eye className="w-3 h-3 mr-1" />
                        Opened
                      </div>
                    )}
                    
                    {notification.tracking?.clicked && (
                      <div className="flex items-center text-xs text-accent-600">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Clicked
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications Found</h3>
            <p className="text-gray-600 mb-6">
              {displayNotifications.length === 0 
                ? 'No notifications sent yet. Start by posting a job to notify matching candidates.'
                : 'No notifications match your current filters.'
              }
            </p>
          </div>
        )}
      </motion.div>

      {/* Communication Templates */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Communication Templates</h3>
          <Settings className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Job Match Notification',
              description: 'Notify candidates about job opportunities',
              icon: Briefcase,
              color: 'primary',
              action: 'Send Job Match'
            },
            {
              title: 'Interview Invitation',
              description: 'Invite candidates for interviews',
              icon: Calendar,
              color: 'secondary',
              action: 'Schedule Interview'
            },
            {
              title: 'Application Update',
              description: 'Update candidates on application status',
              icon: CheckCircle2,
              color: 'success',
              action: 'Send Update'
            },
            {
              title: 'Rejection Notice',
              description: 'Professional rejection with feedback',
              icon: XCircle,
              color: 'error',
              action: 'Send Notice'
            }
          ].map((template, index) => {
            const Icon = template.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border-2 hover:shadow-medium transition-all cursor-pointer",
                  `border-${template.color}-200 bg-${template.color}-50 hover:border-${template.color}-300`
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    `bg-${template.color}-500 text-white`
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{template.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <button className={cn("btn btn-sm", `btn-${template.color}`)}>
                      {template.action}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Notification Statistics */}
      {notificationStats && (
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Communication Analytics</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Delivery Rate */}
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <div className="text-3xl font-bold text-success-600 mb-2">
                {notificationStats.delivery ? 
                  Math.round((notificationStats.delivery.reduce((sum, d) => sum + d.delivered, 0) / 
                  notificationStats.delivery.reduce((sum, d) => sum + d.total, 0)) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Delivery Rate</div>
              <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
            </div>

            {/* Open Rate */}
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <div className="text-3xl font-bold text-primary-600 mb-2">68%</div>
              <div className="text-sm text-gray-600">Open Rate</div>
              <div className="text-xs text-gray-500 mt-1">Above industry avg</div>
            </div>

            {/* Response Rate */}
            <div className="text-center p-4 bg-accent-50 rounded-lg">
              <div className="text-3xl font-bold text-accent-600 mb-2">24%</div>
              <div className="text-sm text-gray-600">Response Rate</div>
              <div className="text-xs text-gray-500 mt-1">Candidate engagement</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Communication Activity</h3>
        
        {notificationStats?.recent && notificationStats.recent.length > 0 ? (
          <div className="space-y-3">
            {notificationStats.recent.map((activity, index) => {
              const Icon = getNotificationIcon(activity.type);
              const statusBadge = getStatusBadgeProps(activity.status);
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatNotificationType(activity.type)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatNotificationTime(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={cn("badge", statusBadge.className)}>
                      {statusBadge.text}
                    </span>
                    {activity.errorMessage && (
                      <div className="text-xs text-error-600 max-w-32 truncate">
                        {activity.errorMessage}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </motion.div>

      {/* Communication Best Practices */}
      <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-accent-50 to-accent-100 border-accent-200">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-accent-900 mb-2">Communication Best Practices</h4>
            <div className="space-y-2 text-sm text-accent-800">
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span>Personalize messages with candidate names and specific job details</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>Send notifications during business hours for better response rates</span>
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2" />
                <span>Focus on candidates with 70%+ match scores for best results</span>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                <span>Follow up within 48 hours of initial contact</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecruiterNotifications;
