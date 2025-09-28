import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  Settings, 
  LogOut,
  User,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { formatNotificationTime } from '../../utils/formatters';

const DashboardHeader = ({ 
  user, 
  profile, 
  notifications = [], 
  onMenuClick, 
  activeSection 
}) => {
  const { logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.readAt);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
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
            placeholder="Search jobs, skills, companies..."
            className="pl-10 pr-4 py-2 w-80 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadNotifications.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center"
              >
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </motion.span>
            )}
          </motion.button>

          {/* Notifications dropdown */}
          {notificationsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-large border border-gray-200 py-2 z-50"
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadNotifications.length > 0 && (
                  <p className="text-xs text-gray-500">{unreadNotifications.length} unread</p>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification._id}
                      className={cn(
                        "px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-2 transition-colors",
                        notification.readAt ? "border-transparent" : "border-primary-500 bg-primary-50/30"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2",
                          notification.readAt ? "bg-gray-300" : "bg-primary-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.subject}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                )}
              </div>
              
              {notifications.length > 5 && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* User menu dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-400 rounded-full flex items-center justify-center">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.fullName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
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
                <p className="text-sm font-medium text-gray-900">
                  {profile?.fullName || user?.email}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              
              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveSection('overview');
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 mr-3 text-gray-400" />
                  View Profile
                </button>
                
                <button
                  onClick={() => {
                    setActiveSection('settings');
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-400" />
                  Settings
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
      {(userMenuOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default DashboardHeader;
