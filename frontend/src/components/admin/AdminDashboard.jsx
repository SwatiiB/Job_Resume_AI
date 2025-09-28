import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  Shield, 
  Users, 
  Briefcase, 
  Bell, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Search,
  AlertTriangle,
  Activity,
  Database,
  Server,
  TrendingUp,
  Eye,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { adminAPI, usersAPI, jobsAPI, notificationsAPI } from '../../services/api';
import { cn } from '../../utils/cn';

// Import admin components
import UserManagement from './UserManagement';
import JobMonitoring from './JobMonitoring';
import NotificationLogs from './NotificationLogs';
import SystemAnalytics from './SystemAnalytics';
import AdminSettings from './AdminSettings';
import AdminHeader from './AdminHeader';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Fetch admin dashboard data
  const { data: systemStats } = useQuery(
    'admin-system-stats',
    adminAPI.getSystemStats,
    {
      select: (response) => response.data.data,
      staleTime: 2 * 60 * 1000,
      refetchInterval: 30 * 1000, // Refresh every 30 seconds
    }
  );

  const { data: recentActivity } = useQuery(
    'admin-recent-activity',
    () => adminAPI.getRecentActivity({ limit: 20 }),
    {
      select: (response) => response.data.data,
      staleTime: 1 * 60 * 1000,
    }
  );

  const { data: systemHealth } = useQuery(
    'admin-system-health',
    adminAPI.getSystemHealth,
    {
      select: (response) => response.data.data,
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
    }
  );

  // Navigation items for admins
  const navigationItems = [
    {
      id: 'overview',
      name: 'System Overview',
      icon: BarChart3,
      description: 'System health and key metrics'
    },
    {
      id: 'users',
      name: 'User Management',
      icon: Users,
      description: 'Manage candidates and recruiters'
    },
    {
      id: 'jobs',
      name: 'Job Monitoring',
      icon: Briefcase,
      description: 'Job moderation and approval'
    },
    {
      id: 'notifications',
      name: 'Notification Logs',
      icon: Bell,
      description: 'Communication monitoring'
    },
    {
      id: 'analytics',
      name: 'System Analytics',
      icon: TrendingUp,
      description: 'Platform insights and trends'
    },
    {
      id: 'settings',
      name: 'Admin Controls',
      icon: Settings,
      description: 'Feature flags and system settings'
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
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

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  // Render active section
  const renderActiveSection = () => {
    const sectionProps = {
      systemStats,
      recentActivity,
      systemHealth,
    };

    switch (activeSection) {
      case 'overview':
        return <AdminOverview {...sectionProps} />;
      case 'users':
        return <UserManagement {...sectionProps} />;
      case 'jobs':
        return <JobMonitoring {...sectionProps} />;
      case 'notifications':
        return <NotificationLogs {...sectionProps} />;
      case 'analytics':
        return <SystemAnalytics {...sectionProps} />;
      case 'settings':
        return <AdminSettings {...sectionProps} />;
      default:
        return <AdminOverview {...sectionProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-large border-r border-gray-200",
          "lg:translate-x-0 lg:static lg:inset-0",
          "transform transition-transform duration-300 ease-in-out lg:transition-none"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-error-500 to-warning-500 rounded-lg flex items-center justify-center">
              <Shield className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Admin Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Admin info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-error-500 to-error-600 rounded-full flex items-center justify-center">
              <Shield className="text-white w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email || 'Administrator'}
              </p>
              <p className="text-xs text-error-600 truncate font-medium">
                System Administrator
              </p>
            </div>
          </div>
          
          {/* System health indicator */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">System Health</span>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  systemHealth?.status === 'healthy' ? "bg-success-500" : 
                  systemHealth?.status === 'warning' ? "bg-warning-500" : "bg-error-500"
                )} />
                <span className={cn(
                  "text-xs font-medium capitalize",
                  systemHealth?.status === 'healthy' ? "text-success-600" : 
                  systemHealth?.status === 'warning' ? "text-warning-600" : "text-error-600"
                )}>
                  {systemHealth?.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center px-3 py-3 text-left rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-error-50 text-error-700 border-r-2 border-error-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-error-600" : "text-gray-400")} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </motion.button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <div>Admin Access Level</div>
            <div className="text-error-600 font-medium mt-1">Full System Control</div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <AdminHeader
          user={user}
          systemStats={systemStats}
          systemHealth={systemHealth}
          onMenuClick={() => setSidebarOpen(true)}
          activeSection={activeSection}
        />

        {/* Dashboard content */}
        <main className="p-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={activeSection}
          >
            {/* Section header */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {navigationItems.find(item => item.id === activeSection)?.name || 'Dashboard'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {navigationItems.find(item => item.id === activeSection)?.description || 'System administration'}
                  </p>
                </div>
                
                {/* System status indicator */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {systemStats?.totalUsers || 0} Users
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {systemStats?.totalJobs || 0} Jobs
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Active section content */}
            <motion.div variants={itemVariants}>
              {renderActiveSection()}
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 bg-error-500 text-white rounded-full shadow-large flex items-center justify-center hover:bg-error-600 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>
    </div>
  );
};

// Admin Overview Component
const AdminOverview = ({ systemStats, recentActivity, systemHealth }) => {
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
      {/* System Health Alert */}
      {systemHealth?.status !== 'healthy' && (
        <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-warning-50 to-error-50 border-warning-200">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-warning-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-warning-900 mb-2">System Alert</h3>
              <p className="text-warning-800 mb-4">
                {systemHealth?.message || 'System requires attention. Please check the logs and metrics.'}
              </p>
              <div className="flex items-center space-x-4 text-sm">
                {systemHealth?.issues?.map((issue, index) => (
                  <div key={index} className="flex items-center text-warning-700">
                    <XCircle className="w-4 h-4 mr-1" />
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Key System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Total Users</h3>
            <Users className="w-5 h-5 text-primary-500" />
          </div>
          <div className="space-y-2">
            <span className="text-2xl font-bold text-gray-900">{systemStats?.totalUsers || 0}</span>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span>{systemStats?.activeUsers || 0} active</span>
              <span>•</span>
              <span>{systemStats?.newUsersToday || 0} new today</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Active Jobs</h3>
            <Briefcase className="w-5 h-5 text-secondary-500" />
          </div>
          <div className="space-y-2">
            <span className="text-2xl font-bold text-gray-900">{systemStats?.activeJobs || 0}</span>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span>{systemStats?.pendingApproval || 0} pending</span>
              <span>•</span>
              <span>{systemStats?.newJobsToday || 0} new today</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            <Bell className="w-5 h-5 text-accent-500" />
          </div>
          <div className="space-y-2">
            <span className="text-2xl font-bold text-gray-900">{systemStats?.notificationsSent || 0}</span>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span>{systemStats?.notificationsFailed || 0} failed</span>
              <span>•</span>
              <span>{systemStats?.notificationsToday || 0} today</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">System Load</h3>
            <Server className="w-5 h-5 text-success-500" />
          </div>
          <div className="space-y-2">
            <span className="text-2xl font-bold text-gray-900">
              {systemHealth?.systemLoad ? `${Math.round(systemHealth.systemLoad * 100)}%` : 'N/A'}
            </span>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span>CPU: {systemHealth?.cpuUsage || 'N/A'}%</span>
              <span>•</span>
              <span>Memory: {systemHealth?.memoryUsage || 'N/A'}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent System Activity</h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>

        {recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.slice(0, 10).map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    activity.type === 'user_registered' ? "bg-success-500" :
                    activity.type === 'job_posted' ? "bg-primary-500" :
                    activity.type === 'notification_failed' ? "bg-error-500" :
                    "bg-gray-400"
                  )} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.userEmail && `by ${activity.userEmail} • `}
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  activity.severity === 'high' ? "bg-error-100 text-error-700" :
                  activity.severity === 'medium' ? "bg-warning-100 text-warning-700" :
                  "bg-success-100 text-success-700"
                )}>
                  {activity.severity || 'info'}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h4>
            <p className="text-gray-600">System activity will appear here</p>
          </div>
        )}
      </motion.div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database Status */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Database</h4>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success-500 rounded-full" />
              <span className="text-xs text-success-600 font-medium">Online</span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Connections</span>
              <span className="font-medium">{systemHealth?.database?.connections || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Response Time</span>
              <span className="font-medium">{systemHealth?.database?.responseTime || 'N/A'}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Storage Used</span>
              <span className="font-medium">{systemHealth?.database?.storageUsed || 'N/A'}%</span>
            </div>
          </div>
        </motion.div>

        {/* Queue Status */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Message Queue</h4>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                systemHealth?.queue?.status === 'healthy' ? "bg-success-500" : "bg-warning-500"
              )} />
              <span className={cn(
                "text-xs font-medium",
                systemHealth?.queue?.status === 'healthy' ? "text-success-600" : "text-warning-600"
              )}>
                {systemHealth?.queue?.status || 'Unknown'}
              </span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Jobs Waiting</span>
              <span className="font-medium">{systemHealth?.queue?.waiting || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jobs Active</span>
              <span className="font-medium">{systemHealth?.queue?.active || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jobs Failed</span>
              <span className="font-medium text-error-600">{systemHealth?.queue?.failed || 0}</span>
            </div>
          </div>
        </motion.div>

        {/* AI Services */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">AI Services</h4>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                systemHealth?.ai?.status === 'healthy' ? "bg-success-500" : "bg-error-500"
              )} />
              <span className={cn(
                "text-xs font-medium",
                systemHealth?.ai?.status === 'healthy' ? "text-success-600" : "text-error-600"
              )}>
                {systemHealth?.ai?.status || 'Unknown'}
              </span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">API Calls Today</span>
              <span className="font-medium">{systemHealth?.ai?.callsToday || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Response</span>
              <span className="font-medium">{systemHealth?.ai?.avgResponseTime || 'N/A'}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-medium text-success-600">{systemHealth?.ai?.successRate || 'N/A'}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Admin Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('users')}
            className="p-4 bg-white border border-primary-200 rounded-xl hover:shadow-medium transition-all text-left"
          >
            <Users className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Manage Users</h4>
            <p className="text-sm text-gray-600">View and manage all platform users</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('jobs')}
            className="p-4 bg-white border border-secondary-200 rounded-xl hover:shadow-medium transition-all text-left"
          >
            <Briefcase className="w-6 h-6 text-secondary-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Monitor Jobs</h4>
            <p className="text-sm text-gray-600">Review and moderate job postings</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('notifications')}
            className="p-4 bg-white border border-accent-200 rounded-xl hover:shadow-medium transition-all text-left"
          >
            <Bell className="w-6 h-6 text-accent-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Check Notifications</h4>
            <p className="text-sm text-gray-600">Monitor system communications</p>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
