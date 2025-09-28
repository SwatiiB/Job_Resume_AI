import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  MoreHorizontal,
  Mail,
  MessageSquare,
  AlertTriangle,
  Activity,
  Download,
  Trash2,
  Send,
  User,
  Calendar,
  ExternalLink,
  TrendingUp,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

import { adminAPI, notificationsAPI } from '../../services/api';
import { cn } from '../../utils/cn';
import { 
  formatRelativeTime, 
  formatNotificationType,
  getStatusBadgeProps 
} from '../../utils/formatters';

const NotificationLogs = () => {
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const queryClient = useQueryClient();

  // Fetch notification logs
  const { data: notificationsData, isLoading, refetch } = useQuery(
    ['admin-notifications', filters],
    () => adminAPI.getNotificationLogs({
      type: filters.type !== 'all' ? filters.type : undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      search: filters.search || undefined,
      limit: 100
    }),
    {
      select: (response) => response.data,
      staleTime: 2 * 60 * 1000,
    }
  );

  // Fetch notification statistics
  const { data: notificationStats } = useQuery(
    'admin-notification-stats',
    adminAPI.getNotificationStats,
    {
      select: (response) => response.data.data,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch queue status
  const { data: queueStatus } = useQuery(
    'admin-queue-status',
    adminAPI.getQueueStatus,
    {
      select: (response) => response.data.data,
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
    }
  );

  // Notification actions mutations
  const retryNotificationMutation = useMutation(
    (notificationId) => adminAPI.retryNotification(notificationId),
    {
      onSuccess: () => {
        toast.success('Notification retry initiated');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to retry notification');
      },
    }
  );

  const retryAllFailedMutation = useMutation(
    () => adminAPI.retryAllFailedNotifications(),
    {
      onSuccess: (data) => {
        toast.success(`Retried ${data.data.retried} notifications`);
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to retry notifications');
      },
    }
  );

  const deleteNotificationMutation = useMutation(
    (notificationId) => adminAPI.deleteNotification(notificationId),
    {
      onSuccess: () => {
        toast.success('Notification deleted successfully');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete notification');
      },
    }
  );

  const bulkNotificationActionMutation = useMutation(
    ({ action, notificationIds }) => adminAPI.bulkNotificationAction(action, notificationIds),
    {
      onSuccess: (data, variables) => {
        toast.success(`Bulk ${variables.action} completed successfully`);
        setSelectedNotifications(new Set());
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Bulk action failed');
      },
    }
  );

  const notifications = notificationsData?.data || [];
  const totalNotifications = notificationsData?.total || 0;

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filters.type === 'all' || notification.type === filters.type;
    const matchesStatus = filters.status === 'all' || notification.status === filters.status;
    const matchesSearch = !filters.search || 
      notification.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
      notification.recipientId?.email?.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleNotificationAction = (action, notificationId) => {
    switch (action) {
      case 'retry':
        retryNotificationMutation.mutate(notificationId);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
          deleteNotificationMutation.mutate(notificationId);
        }
        break;
      default:
        break;
    }
  };

  const handleBulkAction = (action) => {
    if (selectedNotifications.size === 0) {
      toast.error('Please select notifications first');
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedNotifications.size} notifications?`;
    if (window.confirm(confirmMessage)) {
      bulkNotificationActionMutation.mutate({
        action,
        notificationIds: Array.from(selectedNotifications)
      });
    }
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

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(notification => notification._id)));
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'job_match': Mail,
      'interview_scheduled': Calendar,
      'application_status': CheckCircle2,
      'otp_verification': Send,
      'welcome': User,
      'password_reset': AlertTriangle,
      'resume_refresh': RefreshCw
    };
    
    return iconMap[type] || Bell;
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
      {/* Notification System Overview */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Notification System Overview</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => retryAllFailedMutation.mutate()}
              disabled={retryAllFailedMutation.isLoading}
              className="btn btn-warning btn-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry All Failed
            </button>
            <button
              onClick={refetch}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600 mb-1">
              {queueStatus?.completed || 0}
            </div>
            <div className="text-sm text-gray-600">Sent Successfully</div>
          </div>

          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <div className="text-2xl font-bold text-warning-600 mb-1">
              {queueStatus?.waiting || 0}
            </div>
            <div className="text-sm text-gray-600">In Queue</div>
          </div>

          <div className="text-center p-4 bg-error-50 rounded-lg">
            <div className="text-2xl font-bold text-error-600 mb-1">
              {queueStatus?.failed || 0}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>

          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {queueStatus?.active || 0}
            </div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
        </div>

        {/* Queue Health Indicator */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-3 h-3 rounded-full",
              queueStatus?.status === 'healthy' ? "bg-success-500" : 
              queueStatus?.status === 'warning' ? "bg-warning-500" : "bg-error-500"
            )} />
            <span className="font-medium text-gray-900">
              Queue Status: {queueStatus?.status || 'Unknown'}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Response Time: {queueStatus?.responseTime || 'N/A'}ms</span>
            <span>•</span>
            <span>Throughput: {queueStatus?.throughput || 'N/A'}/min</span>
          </div>
        </div>
      </motion.div>

      {/* Notification Logs Header */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notification Logs</h3>
            <p className="text-gray-600 mt-1">
              {totalNotifications} total notifications • {filteredNotifications.length} shown
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button className="btn btn-secondary btn-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
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
              placeholder="Search notifications..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 input"
            />
          </div>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="job_match">Job Matches</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="application_status">Application Status</option>
            <option value="otp_verification">OTP Verification</option>
            <option value="welcome">Welcome</option>
            <option value="password_reset">Password Reset</option>
            <option value="resume_refresh">Resume Refresh</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
          </select>

          <button
            onClick={() => setFilters({ type: 'all', status: 'all', search: '' })}
            className="btn btn-secondary btn-md"
          >
            Clear Filters
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-lg mb-6"
          >
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-primary-900">
                {selectedNotifications.size} notifications selected
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('retry')}
                className="btn btn-warning btn-sm"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
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

      {/* Notification Statistics */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {notificationStats?.totalSent || 0}
            </div>
            <div className="text-sm text-gray-600">Total Sent</div>
            <div className="text-xs text-gray-500 mt-1">All time</div>
          </div>

          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600 mb-1">
              {notificationStats?.deliveryRate ? `${Math.round(notificationStats.deliveryRate * 100)}%` : '0%'}
            </div>
            <div className="text-sm text-gray-600">Delivery Rate</div>
            <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
          </div>

          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <div className="text-2xl font-bold text-accent-600 mb-1">
              {notificationStats?.openRate ? `${Math.round(notificationStats.openRate * 100)}%` : '0%'}
            </div>
            <div className="text-sm text-gray-600">Open Rate</div>
            <div className="text-xs text-gray-500 mt-1">Email notifications</div>
          </div>

          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <div className="text-2xl font-bold text-warning-600 mb-1">
              {notificationStats?.failureRate ? `${Math.round(notificationStats.failureRate * 100)}%` : '0%'}
            </div>
            <div className="text-sm text-gray-600">Failure Rate</div>
            <div className="text-xs text-gray-500 mt-1">Requires attention</div>
          </div>
        </div>
      </motion.div>

      {/* Notifications Table */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Subject</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Recipient</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Sent</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
                    <p className="text-gray-600">Loading notifications...</p>
                  </td>
                </tr>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                  <NotificationTableRow
                    key={notification._id}
                    notification={notification}
                    index={index}
                    isSelected={selectedNotifications.has(notification._id)}
                    onSelect={handleSelectNotification}
                    onAction={handleNotificationAction}
                    onView={(notification) => {
                      setSelectedNotification(notification);
                      setShowNotificationModal(true);
                    }}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications Found</h3>
                    <p className="text-gray-600">
                      {filters.search || filters.type !== 'all' || filters.status !== 'all'
                        ? 'No notifications match your current filters.'
                        : 'No notifications sent yet.'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Notification Detail Modal */}
      {showNotificationModal && selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => {
            setShowNotificationModal(false);
            setSelectedNotification(null);
          }}
          onAction={handleNotificationAction}
        />
      )}
    </motion.div>
  );
};

// Notification Table Row Component
const NotificationTableRow = ({ notification, index, isSelected, onSelect, onAction, onView }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusBadge = getStatusBadgeProps(notification.status);
  const Icon = getNotificationIcon(notification.type);

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
          onChange={() => onSelect(notification._id)}
          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
        />
      </td>
      
      <td className="py-3 px-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatNotificationType(notification.type)}
          </span>
        </div>
      </td>
      
      <td className="py-3 px-4">
        <p className="font-medium text-gray-900 truncate max-w-xs">{notification.subject}</p>
        {notification.metadata?.jobTitle && (
          <p className="text-sm text-gray-500">Job: {notification.metadata.jobTitle}</p>
        )}
      </td>
      
      <td className="py-3 px-4">
        <div>
          <p className="text-sm text-gray-900">{notification.recipientId?.email || 'Unknown'}</p>
          {notification.recipientId?.profile?.fullName && (
            <p className="text-xs text-gray-500">{notification.recipientId.profile.fullName}</p>
          )}
        </div>
      </td>
      
      <td className="py-3 px-4">
        <div className="space-y-1">
          <span className={cn("badge", statusBadge.className)}>
            {statusBadge.text}
          </span>
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
      </td>
      
      <td className="py-3 px-4 text-sm text-gray-600">
        {formatRelativeTime(notification.createdAt)}
        {notification.sentAt && (
          <div className="text-xs text-gray-500">
            Delivered: {formatRelativeTime(notification.sentAt)}
          </div>
        )}
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
                  onView(notification);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 mr-3 text-gray-400" />
                View Details
              </button>
              
              {notification.status === 'failed' && (
                <button
                  onClick={() => {
                    onAction('retry', notification._id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-3" />
                  Retry
                </button>
              )}
              
              <div className="border-t border-gray-100 my-1" />
              
              <button
                onClick={() => {
                  onAction('delete', notification._id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete
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

// Notification Detail Modal Component
const NotificationDetailModal = ({ notification, onClose, onAction }) => {
  const Icon = getNotificationIcon(notification.type);
  const statusBadge = getStatusBadgeProps(notification.status);

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
        className="bg-white rounded-xl shadow-large max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{notification.subject}</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-gray-600">
                    {formatNotificationType(notification.type)}
                  </span>
                  <span className={cn("badge", statusBadge.className)}>
                    {statusBadge.text}
                  </span>
                </div>
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Recipient:</span>
                  <p className="font-medium">{notification.recipientId?.email || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="font-medium">{formatNotificationType(notification.type)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Priority:</span>
                  <p className="font-medium capitalize">{notification.priority || 'normal'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Channel:</span>
                  <p className="font-medium capitalize">{notification.channel || 'email'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="font-medium">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Sent:</span>
                  <p className="font-medium">
                    {notification.sentAt ? 
                      new Date(notification.sentAt).toLocaleString() : 
                      'Not sent yet'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Attempts:</span>
                  <p className="font-medium">{notification.attempts || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Max Attempts:</span>
                  <p className="font-medium">{notification.maxAttempts || 3}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Content</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Subject:</span>
                <p className="text-sm text-gray-900 mt-1">{notification.subject}</p>
              </div>
              {notification.body && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Body:</span>
                  <div className="text-sm text-gray-900 mt-1 prose max-w-none">
                    {notification.body}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(notification.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tracking Information */}
          {notification.tracking && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-primary-50 rounded-lg">
                  <div className="text-lg font-bold text-primary-600">
                    {notification.tracking.opened ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-gray-600">Opened</div>
                  {notification.tracking.openedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(notification.tracking.openedAt).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="text-center p-3 bg-secondary-50 rounded-lg">
                  <div className="text-lg font-bold text-secondary-600">
                    {notification.tracking.clicked ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-gray-600">Clicked</div>
                  {notification.tracking.clickedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(notification.tracking.clickedAt).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="text-center p-3 bg-accent-50 rounded-lg">
                  <div className="text-lg font-bold text-accent-600">
                    {notification.tracking.bounced ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-gray-600">Bounced</div>
                  {notification.tracking.bouncedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(notification.tracking.bouncedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Information */}
          {notification.errorMessage && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Details</h3>
              <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-sm text-error-800">{notification.errorMessage}</p>
                {notification.errorStack && (
                  <details className="mt-3">
                    <summary className="text-sm font-medium text-error-700 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-error-600 mt-2 whitespace-pre-wrap">
                      {notification.errorStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          {notification.status === 'failed' && (
            <button
              onClick={() => {
                onAction('retry', notification._id);
                onClose();
              }}
              className="btn btn-warning btn-md"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Notification
            </button>
          )}
          
          <button
            onClick={() => {
              onAction('delete', notification._id);
              onClose();
            }}
            className="btn btn-error btn-md"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
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

export default NotificationLogs;
