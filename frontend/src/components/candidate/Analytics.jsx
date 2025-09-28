import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Eye,
  Download,
  Calendar,
  Award,
  Briefcase,
  FileText,
  Star,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

import { cn } from '../../utils/cn';
import { formatPercentage, formatRelativeTime } from '../../utils/formatters';

const Analytics = ({ profile, resumes, jobRecommendations }) => {
  const [timeRange, setTimeRange] = useState('30d');

  // Sample data for analytics (would come from API in real implementation)
  const applicationData = [
    { month: 'Jan', applications: 4, interviews: 1, offers: 0 },
    { month: 'Feb', applications: 6, interviews: 2, offers: 1 },
    { month: 'Mar', applications: 8, interviews: 3, offers: 1 },
    { month: 'Apr', applications: 5, interviews: 2, offers: 0 },
    { month: 'May', applications: 7, interviews: 4, offers: 2 },
    { month: 'Jun', applications: 9, interviews: 3, offers: 1 },
  ];

  const skillsCoverageData = [
    { skill: 'JavaScript', coverage: 95, demand: 88 },
    { skill: 'React', coverage: 90, demand: 85 },
    { skill: 'Node.js', coverage: 85, demand: 82 },
    { skill: 'Python', coverage: 75, demand: 90 },
    { skill: 'AWS', coverage: 60, demand: 95 },
    { skill: 'Docker', coverage: 70, demand: 78 },
  ];

  const jobMatchDistribution = [
    { range: '80-100%', count: 8, color: '#22c55e' },
    { range: '60-79%', count: 15, color: '#f97316' },
    { range: '40-59%', count: 12, color: '#eab308' },
    { range: '20-39%', count: 5, color: '#ef4444' },
  ];

  const profileViewsData = [
    { date: '2024-01-01', views: 12, applications: 2 },
    { date: '2024-01-08', views: 18, applications: 3 },
    { date: '2024-01-15', views: 25, applications: 5 },
    { date: '2024-01-22', views: 22, applications: 4 },
    { date: '2024-01-29', views: 30, applications: 6 },
    { date: '2024-02-05', views: 28, applications: 5 },
  ];

  // Calculate key metrics
  const totalApplications = applicationData.reduce((sum, item) => sum + item.applications, 0);
  const totalInterviews = applicationData.reduce((sum, item) => sum + item.interviews, 0);
  const totalOffers = applicationData.reduce((sum, item) => sum + item.offers, 0);
  
  const interviewRate = totalApplications > 0 ? (totalInterviews / totalApplications) * 100 : 0;
  const offerRate = totalInterviews > 0 ? (totalOffers / totalInterviews) * 100 : 0;

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
      {/* Key Metrics */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Career Insights</h3>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Applications */}
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-primary-600 mb-1">{totalApplications}</div>
            <div className="text-sm text-gray-600">Applications Sent</div>
            <div className="flex items-center justify-center mt-2 text-xs text-success-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% this month
            </div>
          </div>

          {/* Interview Rate */}
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <div className="w-12 h-12 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-secondary-600 mb-1">
              {formatPercentage(interviewRate, 1)}
            </div>
            <div className="text-sm text-gray-600">Interview Rate</div>
            <div className="flex items-center justify-center mt-2 text-xs text-success-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              Above average
            </div>
          </div>

          {/* Offer Rate */}
          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-accent-600 mb-1">
              {formatPercentage(offerRate, 1)}
            </div>
            <div className="text-sm text-gray-600">Offer Rate</div>
            <div className="flex items-center justify-center mt-2 text-xs text-success-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              Excellent
            </div>
          </div>

          {/* Profile Views */}
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="w-12 h-12 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-success-600 mb-1">
              {profileViewsData.reduce((sum, item) => sum + item.views, 0)}
            </div>
            <div className="text-sm text-gray-600">Profile Views</div>
            <div className="flex items-center justify-center mt-2 text-xs text-success-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +18% this week
            </div>
          </div>
        </div>
      </motion.div>

      {/* Application Funnel Chart */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Application Funnel</h3>
            <p className="text-gray-600 mt-1">Track your job application progress over time</p>
          </div>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={applicationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="applications" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="interviews" fill="#eab308" radius={[4, 4, 0, 0]} />
              <Bar dataKey="offers" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary-500 rounded mr-2"></div>
            <span className="text-gray-600">Applications</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-secondary-500 rounded mr-2"></div>
            <span className="text-gray-600">Interviews</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success-500 rounded mr-2"></div>
            <span className="text-gray-600">Offers</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Coverage */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Skills Coverage</h3>
              <p className="text-gray-600 mt-1">How your skills match market demand</p>
            </div>
            <Target className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {skillsCoverageData.map((skill, index) => (
              <motion.div
                key={skill.skill}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{skill.skill}</span>
                  <span className="text-gray-600">{skill.coverage}%</span>
                </div>
                <div className="relative">
                  <div className="progress h-2 bg-gray-200">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.coverage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                  <div className="absolute top-0 left-0 h-2 bg-gray-300 rounded-full opacity-30" style={{ width: `${skill.demand}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Your level: {skill.coverage}%</span>
                  <span>Market demand: {skill.demand}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Job Match Distribution */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Match Score Distribution</h3>
              <p className="text-gray-600 mt-1">How well you match available jobs</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-gray-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobMatchDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {jobMatchDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {jobMatchDistribution.map((item, index) => (
              <div key={index} className="flex items-center text-sm">
                <div 
                  className="w-3 h-3 rounded mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600">{item.range}: </span>
                <span className="font-medium ml-1">{item.count} jobs</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Profile Performance */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profile Performance</h3>
            <p className="text-gray-600 mt-1">Views and engagement over time</p>
          </div>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={profileViewsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                stroke="#f97316" 
                fill="#f97316" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="applications" 
                stroke="#22c55e" 
                fill="#22c55e" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary-500 rounded mr-2"></div>
            <span className="text-gray-600">Profile Views</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success-500 rounded mr-2"></div>
            <span className="text-gray-600">Applications</span>
          </div>
        </div>
      </motion.div>

      {/* Resume Analytics */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Resume Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resumes && resumes.map((resume, index) => (
            <motion.div
              key={resume._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 rounded-lg border-2 transition-all",
                resume.isActive 
                  ? "border-primary-200 bg-primary-50" 
                  : "border-gray-200 bg-gray-50"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900 truncate">
                    {resume.originalName}
                  </span>
                </div>
                {resume.isActive && (
                  <span className="px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">ATS Score</span>
                  <span className="font-semibold text-gray-900">{resume.atsScore || 0}%</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold text-gray-900">{resume.viewCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Downloads</span>
                  <span className="font-semibold text-gray-900">{resume.downloadCount || 0}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-semibold text-gray-900">
                    {formatRelativeTime(resume.updatedAt)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Career Recommendations */}
      <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-accent-50 to-accent-100 border-accent-200">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-accent-900 mb-2">Career Growth Insights</h4>
            <div className="space-y-3 text-sm text-accent-800">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>Your interview rate is 15% above industry average</span>
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2" />
                <span>Adding AWS skills could increase job matches by 25%</span>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                <span>Your profile ranks in the top 20% for software engineers</span>
              </div>
            </div>
            
            <div className="mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-accent btn-sm"
              >
                View Detailed Report
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Goals and Targets */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Career Goals</h3>
        
        <div className="space-y-4">
          {[
            {
              title: 'Complete Profile to 100%',
              current: profile?.profileCompletion || 0,
              target: 100,
              color: 'primary',
              icon: User
            },
            {
              title: 'Improve ATS Score',
              current: resumes?.[0]?.atsScore || 0,
              target: 90,
              color: 'secondary',
              icon: FileText
            },
            {
              title: 'Increase Interview Rate',
              current: interviewRate,
              target: 25,
              color: 'accent',
              icon: Users
            },
            {
              title: 'Monthly Applications',
              current: 8,
              target: 15,
              color: 'success',
              icon: Briefcase
            }
          ].map((goal, index) => {
            const progress = Math.min(100, (goal.current / goal.target) * 100);
            const Icon = goal.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  `bg-${goal.color}-100 text-${goal.color}-600`
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{goal.title}</span>
                    <span className="text-sm text-gray-600">
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  
                  <div className="progress h-2">
                    <motion.div
                      className={cn("h-full rounded-full", `bg-${goal.color}-500`)}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {progress >= 100 ? 'Goal achieved!' : `${(100 - progress).toFixed(0)}% to go`}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Analytics;
