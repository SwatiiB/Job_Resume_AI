import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  User, 
  FileText, 
  Briefcase, 
  Bell, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Search,
  Filter
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, resumesAPI, jobsAPI, notificationsAPI, aiAPI } from '../../services/api';
import { cn } from '../../utils/cn';

// Import dashboard components
import ProfileOverview from './ProfileOverview';
import ResumeUpload from './ResumeUpload';
import JobRecommendations from './JobRecommendations';
import NotificationsPanel from './NotificationsPanel';
import Analytics from './Analytics';
import DashboardHeader from './DashboardHeader';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Fetch dashboard data
  const { data: profile, refetch: refetchProfile } = useQuery(
    'profile',
    usersAPI.getProfile,
    {
      select: (response) => response.data.profile,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const { data: resumes, refetch: refetchResumes } = useQuery(
    'my-resumes',
    () => usersAPI.getMyResumes({ includeInactive: false }),
    {
      select: (response) => response.data.data,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: jobRecommendations, refetch: refetchJobs } = useQuery(
    'job-recommendations',
    async () => {
      if (!resumes || resumes.length === 0) return { matches: [] };
      const activeResume = resumes.find(r => r.isActive) || resumes[0];
      if (!activeResume) return { matches: [] };
      
      const response = await aiAPI.getJobRecommendations(activeResume._id, {}, 10);
      return response.data;
    },
    {
      enabled: !!resumes && resumes.length > 0,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const { data: notifications } = useQuery(
    'notifications',
    () => notificationsAPI.getNotifications({ limit: 10 }),
    {
      select: (response) => response.data.data,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  const { data: profileCompletion } = useQuery(
    'profile-completion',
    usersAPI.getProfileCompletion,
    {
      select: (response) => response.data,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Navigation items
  const navigationItems = [
    {
      id: 'overview',
      name: 'Overview',
      icon: User,
      description: 'Profile and quick stats'
    },
    {
      id: 'resume',
      name: 'Resume',
      icon: FileText,
      description: 'Upload and analyze resume'
    },
    {
      id: 'jobs',
      name: 'Job Matches',
      icon: Briefcase,
      description: 'AI-powered job recommendations'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Messages and alerts'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      description: 'Career insights and progress'
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
      profile,
      resumes,
      jobRecommendations,
      notifications,
      profileCompletion,
      refetchProfile,
      refetchResumes,
      refetchJobs,
    };

    switch (activeSection) {
      case 'overview':
        return <ProfileOverview {...sectionProps} />;
      case 'resume':
        return <ResumeUpload {...sectionProps} />;
      case 'jobs':
        return <JobRecommendations {...sectionProps} />;
      case 'notifications':
        return <NotificationsPanel {...sectionProps} />;
      case 'analytics':
        return <Analytics {...sectionProps} />;
      default:
        return <ProfileOverview {...sectionProps} />;
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
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RR</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Resume Refresh</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-400 rounded-full flex items-center justify-center">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.fullName || profile?.firstName || user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.experience?.[0]?.position || 'Candidate'}
              </p>
            </div>
          </div>
          
          {/* Profile completion */}
          {profileCompletion && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Profile Completion</span>
                <span>{profileCompletion.profileCompletion}%</span>
              </div>
              <div className="progress h-2">
                <motion.div
                  className="progress-bar h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompletion.profileCompletion}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
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
                    ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary-600" : "text-gray-400")} />
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
          <button
            onClick={() => setActiveSection('settings')}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <DashboardHeader
          user={user}
          profile={profile}
          notifications={notifications}
          onMenuClick={() => setSidebarOpen(true)}
          activeSection={activeSection}
        />

        {/* Dashboard content */}
        <main className="p-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={activeSection} // Re-animate when section changes
          >
            {/* Section header */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {navigationItems.find(item => item.id === activeSection)?.name || 'Dashboard'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {navigationItems.find(item => item.id === activeSection)?.description || 'Welcome to your dashboard'}
                  </p>
                </div>
                
                {/* Quick actions */}
                <div className="flex items-center space-x-3">
                  {activeSection === 'jobs' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={refetchJobs}
                      className="btn btn-secondary btn-sm"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Refresh Jobs
                    </motion.button>
                  )}
                  
                  {activeSection === 'resume' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={refetchResumes}
                      className="btn btn-primary btn-sm"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Upload Resume
                    </motion.button>
                  )}
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
        className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 bg-primary-500 text-white rounded-full shadow-large flex items-center justify-center hover:bg-primary-600 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>
    </div>
  );
};

export default CandidateDashboard;
