import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  Briefcase, 
  Users, 
  BarChart3, 
  Bell, 
  Settings,
  Plus,
  Menu,
  X,
  Search,
  Filter,
  TrendingUp,
  Target,
  Calendar,
  Mail
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { jobsAPI, usersAPI, notificationsAPI, aiAPI } from '../../services/api';
import { cn } from '../../utils/cn';

// Import recruiter components
import JobManagement from './JobManagement';
import CandidateMatches from './CandidateMatches';
import RecruiterAnalytics from './RecruiterAnalytics';
import RecruiterNotifications from './RecruiterNotifications';
import RecruiterProfile from './RecruiterProfile';
import RecruiterHeader from './RecruiterHeader';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Fetch recruiter dashboard data
  const { data: profile, refetch: refetchProfile } = useQuery(
    'recruiter-profile',
    usersAPI.getProfile,
    {
      select: (response) => response.data.profile,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: myJobs, refetch: refetchJobs } = useQuery(
    'my-jobs',
    () => jobsAPI.getMyJobs({ limit: 50 }),
    {
      select: (response) => response.data.data,
      staleTime: 2 * 60 * 1000,
    }
  );

  const { data: notifications } = useQuery(
    'recruiter-notifications',
    () => notificationsAPI.getNotifications({ limit: 20 }),
    {
      select: (response) => response.data.data,
      staleTime: 1 * 60 * 1000,
    }
  );

  // Navigation items for recruiters
  const navigationItems = [
    {
      id: 'overview',
      name: 'Overview',
      icon: BarChart3,
      description: 'Dashboard summary and quick stats'
    },
    {
      id: 'jobs',
      name: 'Job Management',
      icon: Briefcase,
      description: 'Post, edit, and manage job listings'
    },
    {
      id: 'candidates',
      name: 'Candidate Matches',
      icon: Users,
      description: 'AI-ranked candidates for your jobs'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: TrendingUp,
      description: 'Hiring metrics and performance'
    },
    {
      id: 'notifications',
      name: 'Communications',
      icon: Mail,
      description: 'Messages and notifications'
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
      myJobs,
      notifications,
      refetchProfile,
      refetchJobs,
    };

    switch (activeSection) {
      case 'overview':
        return <RecruiterOverview {...sectionProps} />;
      case 'jobs':
        return <JobManagement {...sectionProps} />;
      case 'candidates':
        return <CandidateMatches {...sectionProps} />;
      case 'analytics':
        return <RecruiterAnalytics {...sectionProps} />;
      case 'notifications':
        return <RecruiterNotifications {...sectionProps} />;
      case 'profile':
        return <RecruiterProfile {...sectionProps} />;
      default:
        return <RecruiterOverview {...sectionProps} />;
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
            <span className="text-lg font-semibold text-gray-900">Recruiter Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Recruiter info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'R'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.fullName || profile?.firstName || user?.email || 'Recruiter'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.company?.name || 'Company Recruiter'}
              </p>
            </div>
          </div>
          
          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-primary-50 rounded-lg">
              <div className="text-lg font-bold text-primary-600">{myJobs?.length || 0}</div>
              <div className="text-xs text-gray-600">Active Jobs</div>
            </div>
            <div className="p-2 bg-success-50 rounded-lg">
              <div className="text-lg font-bold text-success-600">
                {myJobs?.reduce((sum, job) => sum + (job.applicationCount || 0), 0) || 0}
              </div>
              <div className="text-xs text-gray-600">Applications</div>
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
                    ? "bg-accent-50 text-accent-700 border-r-2 border-accent-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-accent-600" : "text-gray-400")} />
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
            onClick={() => setActiveSection('profile')}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 mr-3" />
            Profile & Settings
          </button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <RecruiterHeader
          user={user}
          profile={profile}
          notifications={notifications}
          onMenuClick={() => setSidebarOpen(true)}
          activeSection={activeSection}
          myJobs={myJobs}
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
                    {navigationItems.find(item => item.id === activeSection)?.description || 'Recruiter dashboard'}
                  </p>
                </div>
                
                {/* Quick actions */}
                <div className="flex items-center space-x-3">
                  {activeSection === 'jobs' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn btn-primary btn-md"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Post New Job
                    </motion.button>
                  )}
                  
                  {activeSection === 'candidates' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn btn-secondary btn-md"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search Candidates
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
        className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 bg-accent-500 text-white rounded-full shadow-large flex items-center justify-center hover:bg-accent-600 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>
    </div>
  );
};

// Recruiter Overview Component
const RecruiterOverview = ({ profile, myJobs, notifications }) => {
  const activeJobs = myJobs?.filter(job => job.status === 'active') || [];
  const totalApplications = myJobs?.reduce((sum, job) => sum + (job.applicationCount || 0), 0) || 0;
  const avgMatchScore = 75; // This would be calculated from actual data

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
      {/* Welcome Section */}
      <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-accent-50 to-accent-100 border-accent-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-accent-900 mb-2">
              Welcome back, {profile?.firstName || 'Recruiter'}!
            </h2>
            <p className="text-accent-800">
              {profile?.company?.name ? `Managing talent for ${profile.company.name}` : 'Ready to find great talent?'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Active Jobs</h3>
            <Briefcase className="w-5 h-5 text-primary-500" />
          </div>
          <div className="space-y-2">
            <span className="text-2xl font-bold text-gray-900">{activeJobs.length}</span>
            <p className="text-xs text-gray-500">
              {myJobs?.length || 0} total jobs posted
            </p>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Total Applications</h3>
            <Users className="w-5 h-5 text-secondary-500" />
          </div>
          <div className="space-y-2">
            <span className="text-2xl font-bold text-gray-900">{totalApplications}</span>
            <p className="text-xs text-gray-500">Across all job postings</p>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Avg Match Score</h3>
            <Target className="w-5 h-5 text-accent-500" />
          </div>
          <div className="space-y-2">
            <span className="text-2xl font-bold text-gray-900">{avgMatchScore}%</span>
            <p className="text-xs text-gray-500">AI matching accuracy</p>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">This Month</h3>
            <Calendar className="w-5 h-5 text-success-500" />
          </div>
          <div className="space-y-2">
            <span className="text-2xl font-bold text-gray-900">8</span>
            <p className="text-xs text-gray-500">Candidates hired</p>
          </div>
        </motion.div>
      </div>

      {/* Recent Jobs */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Job Postings</h3>
          <button
            onClick={() => setActiveSection('jobs')}
            className="text-sm text-accent-600 hover:text-accent-700 font-medium"
          >
            View All Jobs
          </button>
        </div>

        {activeJobs.length > 0 ? (
          <div className="space-y-4">
            {activeJobs.slice(0, 3).map((job, index) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{job.title}</h4>
                  <p className="text-sm text-gray-600">{job.location.city}, {job.location.state}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{job.applicationCount || 0} applications</span>
                    <span>•</span>
                    <span>{job.viewCount || 0} views</span>
                    <span>•</span>
                    <span>Posted {formatRelativeTime(job.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    job.status === 'active' ? "bg-success-100 text-success-700" :
                    job.status === 'paused' ? "bg-warning-100 text-warning-700" :
                    "bg-gray-100 text-gray-700"
                  )}>
                    {job.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Jobs</h4>
            <p className="text-gray-600 mb-4">Post your first job to start finding great candidates</p>
            <button
              onClick={() => setActiveSection('jobs')}
              className="btn btn-primary btn-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Your First Job
            </button>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('jobs')}
            className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl hover:shadow-medium transition-all text-left"
          >
            <Plus className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Post New Job</h4>
            <p className="text-sm text-gray-600">Create a new job posting and find candidates</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('candidates')}
            className="p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 border border-secondary-200 rounded-xl hover:shadow-medium transition-all text-left"
          >
            <Users className="w-6 h-6 text-secondary-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">Browse Candidates</h4>
            <p className="text-sm text-gray-600">View AI-ranked candidates for your jobs</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('analytics')}
            className="p-4 bg-gradient-to-r from-accent-50 to-accent-100 border border-accent-200 rounded-xl hover:shadow-medium transition-all text-left"
          >
            <BarChart3 className="w-6 h-6 text-accent-600 mb-2" />
            <h4 className="font-semibold text-gray-900 mb-1">View Analytics</h4>
            <p className="text-sm text-gray-600">Track hiring performance and metrics</p>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecruiterDashboard;
