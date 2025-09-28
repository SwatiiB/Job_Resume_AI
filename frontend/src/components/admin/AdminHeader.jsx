import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  Settings, 
  LogOut,
  Shield,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Users,
  Briefcase,
  Database,
  RefreshCw
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

const AdminHeader = ({ 
  user, 
  systemStats,
  systemHealth,
  onMenuClick, 
  activeSection
}) => {
  const { logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  const getSystemStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-success-600 bg-success-50';
      case 'warning':
        return 'text-warning-600 bg-warning-50';
      case 'critical':
        return 'text-error-600 bg-error-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Search bar */}
        <div className="hidden md:block relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users, jobs, logs..."
            className="pl-10 pr-4 py-2 w-80 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-error-500 focus:border-error-500 transition-colors"
          />
        </div>

        {/* System stats */}
        <div className="hidden lg:flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-primary-500" />
            <span className="text-gray-600">{systemStats?.totalUsers || 0} users</span>
          </div>
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-secondary-500" />
            <span className="text-gray-600">{systemStats?.activeJobs || 0} jobs</span>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-accent-500" />
            <span className="text-gray-600">{systemStats?.notificationsSent || 0} notifications</span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* System health dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSystemMenuOpen(!systemMenuOpen)}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
              getSystemStatusColor(systemHealth?.status)
            )}
          >
            {systemHealth?.status === 'healthy' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : systemHealth?.status === 'warning' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            <span className="hidden md:block">
              {systemHealth?.status === 'healthy' ? 'System Healthy' : 
               systemHealth?.status === 'warning' ? 'System Warning' : 
               systemHealth?.status === 'critical' ? 'System Critical' : 'System Unknown'}
            </span>
            <ChevronDown className="w-3 h-3" />
          </motion.button>

          {/* System health dropdown */}
          {systemMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-large border border-gray-200 py-4 z-50"
            >
              <div className="px-4 pb-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">System Health Status</h3>
                <p className="text-xs text-gray-500 mt-1">Real-time system monitoring</p>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Overall Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Health</span>
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

                {/* Component Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Database</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-success-500 rounded-full" />
                      <span className="text-success-600 text-xs">Online</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Message Queue</span>
                    <div className="flex items-center space-x-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        systemHealth?.queue?.status === 'healthy' ? "bg-success-500" : "bg-warning-500"
                      )} />
                      <span className={cn(
                        "text-xs",
                        systemHealth?.queue?.status === 'healthy' ? "text-success-600" : "text-warning-600"
                      )}>
                        {systemHealth?.queue?.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">AI Services</span>
                    <div className="flex items-center space-x-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        systemHealth?.ai?.status === 'healthy' ? "bg-success-500" : "bg-error-500"
                      )} />
                      <span className={cn(
                        "text-xs",
                        systemHealth?.ai?.status === 'healthy' ? "text-success-600" : "text-error-600"
                      )}>
                        {systemHealth?.ai?.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Metrics */}
                <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">CPU Usage</span>
                    <span className="font-medium">{systemHealth?.cpuUsage || 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Memory Usage</span>
                    <span className="font-medium">{systemHealth?.memoryUsage || 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active Connections</span>
                    <span className="font-medium">{systemHealth?.database?.connections || 'N/A'}</span>
                  </div>
                </div>

                {/* Refresh Button */}
                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      // Trigger system health refresh
                      window.location.reload();
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh Status</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Critical alerts indicator */}
        {systemHealth?.criticalAlerts > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <button className="p-2 rounded-lg bg-error-50 hover:bg-error-100 transition-colors">
              <AlertTriangle className="w-5 h-5 text-error-600" />
            </button>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              {systemHealth.criticalAlerts > 9 ? '9+' : systemHealth.criticalAlerts}
            </motion.span>
          </motion.div>
        )}

        {/* User menu dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-error-500 to-error-600 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </motion.button>

          {/* User dropdown menu */}
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-large border border-gray-200 py-2 z-50"
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Administrator</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs text-error-600 font-medium">Full System Access</p>
              </div>
              
              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveSection('settings');
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-400" />
                  Admin Settings
                </button>
                
                <button
                  onClick={() => {
                    // Navigate to system logs
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Activity className="w-4 h-4 mr-3 text-gray-400" />
                  System Logs
                </button>
              </div>
              
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(userMenuOpen || systemMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserMenuOpen(false);
            setSystemMenuOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default AdminHeader;
