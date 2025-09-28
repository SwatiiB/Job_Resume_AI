import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from 'react-query';
import { 
  Bell, 
  Mail, 
  Briefcase, 
  FileText, 
  Settings,
  Check,
  X,
  ExternalLink,
  Filter,
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

import { notificationsAPI } from '../../services/api';
import { cn } from '../../utils/cn';
import { 
  formatNotificationTime, 
  formatNotificationType,
  getStatusBadgeProps 
} from '../../utils/formatters';

const NotificationsPanel = ({ notifications = [] }) => {
  const [filter, setFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const queryClient = useQueryClient();

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    (notificationId) => notificationsAPI.markAsRead(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
      },
      onError: (error) => {
        toast.error('Failed to mark notification as read');
      },
    }
  );

  // Update preferences mutation
  const updatePreferencesMutation = useMutation(
    (preferences) => notificationsAPI.updateNotificationPreferences(preferences),
    {
      onSuccess: () => {
        toast.success('Notification preferences updated!');
      },
      onError: (error) => {
        toast.error('Failed to update preferences');
      },
    }
  );

  const getNotificationIcon = (type) => {
    const iconMap = {
      'otp_verification': Mail,
      'job_match': Briefcase,
      'resume_refresh_reminder': FileText,
      'welcome': CheckCircle2,
      'password_reset': Settings,
      'application_status': Briefcase,
      'interview_scheduled': Clock,
      'profile_completion': Info,
      'job_alert': Bell,
      'resume_analysis_complete': BarChart3
    };
    
    return iconMap[type] || Bell;
  };

  const getNotificationColor = (type, isRead) => {
    const baseOpacity = isRead ? 'opacity-60' : '';
    
    const colorMap = {
      'job_match': `text-primary-600 bg-primary-100 ${baseOpacity}`,
      'application_status': `text-success-600 bg-success-100 ${baseOpacity}`,
      'interview_scheduled': `text-accent-600 bg-accent-100 ${baseOpacity}`,
      'resume_refresh_reminder': `text-secondary-600 bg-secondary-100 ${baseOpacity}`,
      'otp_verification': `text-warning-600 bg-warning-100 ${baseOpacity}`,
      'welcome': `text-success-600 bg-success-100 ${baseOpacity}`,
      'default': `text-gray-600 bg-gray-100 ${baseOpacity}`
    };
    
    return colorMap[type] || colorMap.default;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.readAt;
    if (filter === 'read') return notification.readAt;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleSelectNotification = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (selectedNotifications.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleMarkAllAsRead = () => {
    const unreadNotifications = notifications.filter(n => !n.readAt);
    unreadNotifications.forEach(notification => {
      markAsReadMutation.mutate(notification._id);
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
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
      {/* Notifications Header */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMarkAllAsRead}
              className="btn btn-primary btn-sm mt-4 sm:mt-0"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark All Read
            </motion.button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'job_match', label: 'Job Matches', count: notifications.filter(n => n.type === 'job_match').length },
            { key: 'application_status', label: 'Applications', count: notifications.filter(n => n.type === 'application_status').length },
          ].map(filterOption => (
            <motion.button
              key={filterOption.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(filterOption.key)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                filter === filterOption.key
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {filterOption.label}
              {filterOption.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white rounded-full text-xs">
                  {filterOption.count}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => {
            const Icon = getNotificationIcon(notification.type);
            const isRead = !!notification.readAt;
            const isSelected = selectedNotifications.has(notification._id);
            
            return (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "dashboard-card cursor-pointer transition-all duration-200",
                  !isRead && "border-l-4 border-l-primary-500 bg-primary-50/30",
                  isSelected && "ring-2 ring-primary-500",
                  "hover:shadow-medium"
                )}
                onClick={() => !isRead && handleMarkAsRead(notification._id)}
              >
                <div className="flex items-start space-x-4">
                  {/* Notification Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    getNotificationColor(notification.type, isRead)
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={cn(
                          "text-sm font-semibold truncate",
                          isRead ? "text-gray-600" : "text-gray-900"
                        )}>
                          {notification.subject}
                        </h4>
                        
                        <p className={cn(
                          "text-sm mt-1",
                          isRead ? "text-gray-500" : "text-gray-600"
                        )}>
                          {formatNotificationType(notification.type)}
                        </p>

                        {/* Metadata */}
                        {notification.metadata?.matchScore && (
                          <div className="flex items-center mt-2 space-x-2">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getMatchScoreColor(notification.metadata.matchScore)
                            )}>
                              {notification.metadata.matchScore}% Match
                            </span>
                          </div>
                        )}

                        {/* Job details for job match notifications */}
                        {notification.type === 'job_match' && notification.metadata?.jobId && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-600">
                              Job: <span className="font-medium">Software Engineer at Tech Corp</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Time and Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                        
                        {!isRead && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full" />
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {notification.type === 'job_match' && (
                      <div className="flex items-center space-x-2 mt-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="btn btn-primary btn-sm"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Job
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="btn btn-secondary btn-sm"
                        >
                          Save for Later
                        </motion.button>
                      </div>
                    )}

                    {notification.type === 'resume_refresh_reminder' && (
                      <div className="flex items-center space-x-2 mt-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="btn btn-primary btn-sm"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Update Profile
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No Notifications' : `No ${filter} Notifications`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You're all caught up! New notifications will appear here."
                : `No ${filter} notifications found. Try changing the filter.`
              }
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="btn btn-secondary btn-md"
              >
                View All Notifications
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Notification Preferences */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
          <Settings className="w-5 h-5 text-gray-400" />
        </div>
        
        <p className="text-gray-600 mb-6">
          Control what notifications you receive and how often.
        </p>

        <div className="space-y-4">
          {[
            {
              key: 'job_match',
              title: 'Job Match Alerts',
              description: 'Get notified when new jobs match your profile',
              icon: Briefcase,
              color: 'text-primary-600 bg-primary-100'
            },
            {
              key: 'resume_refresh_reminder',
              title: 'Resume Refresh Reminders',
              description: 'Weekly reminders to keep your profile updated',
              icon: FileText,
              color: 'text-secondary-600 bg-secondary-100'
            },
            {
              key: 'application_status',
              title: 'Application Updates',
              description: 'Updates on your job application status',
              icon: CheckCircle2,
              color: 'text-success-600 bg-success-100'
            },
            {
              key: 'interview_scheduled',
              title: 'Interview Notifications',
              description: 'Reminders about upcoming interviews',
              icon: Clock,
              color: 'text-accent-600 bg-accent-100'
            }
          ].map((preference) => {
            const Icon = preference.icon;
            
            return (
              <div key={preference.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", preference.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{preference.title}</h4>
                    <p className="text-sm text-gray-600">{preference.description}</p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    onChange={(e) => {
                      updatePreferencesMutation.mutate({
                        [preference.key]: e.target.checked
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* AMP Email Reminder */}
      <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-secondary-50 to-secondary-100 border-secondary-200">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-secondary-500 rounded-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-secondary-900 mb-2">Interactive Email Updates</h4>
            <p className="text-secondary-800 text-sm mb-4">
              Your resume refresh emails are interactive! You can update your profile directly from your inbox using our AMP-powered emails.
            </p>
            
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-secondary btn-sm"
              >
                <Mail className="w-4 h-4 mr-2" />
                Check Your Inbox
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-outline btn-sm border-secondary-500 text-secondary-700 hover:bg-secondary-500"
              >
                Resend Reminder
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification Stats */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Activity</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {notifications.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          
          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <div className="text-2xl font-bold text-warning-600 mb-1">
              {unreadCount}
            </div>
            <div className="text-sm text-gray-600">Unread</div>
          </div>
          
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600 mb-1">
              {notifications.filter(n => n.type === 'job_match').length}
            </div>
            <div className="text-sm text-gray-600">Job Matches</div>
          </div>
          
          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <div className="text-2xl font-bold text-accent-600 mb-1">
              {notifications.filter(n => n.tracking?.clicked).length}
            </div>
            <div className="text-sm text-gray-600">Clicked</div>
          </div>
        </div>
      </motion.div>

      {/* Tips for Better Notifications */}
      <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-accent-50 to-accent-100 border-accent-200">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-accent-600 mt-1" />
          <div>
            <h4 className="font-semibold text-accent-900 mb-2">Get Better Job Matches</h4>
            <p className="text-accent-800 text-sm mb-3">
              Improve your notification relevance and get more targeted job recommendations:
            </p>
            <ul className="text-sm text-accent-700 space-y-1">
              <li>• Complete your profile to 100% for better AI matching</li>
              <li>• Update your skills regularly to match current market trends</li>
              <li>• Set specific job preferences (location, salary, type)</li>
              <li>• Keep your resume current with latest experience</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NotificationsPanel;
