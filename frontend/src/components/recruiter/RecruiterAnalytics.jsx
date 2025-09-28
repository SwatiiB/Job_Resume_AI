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
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase,
  Calendar,
  Award,
  Target,
  Clock,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Filter
} from 'lucide-react';

import { cn } from '../../utils/cn';
import { formatPercentage, formatCurrency } from '../../utils/formatters';

const RecruiterAnalytics = ({ myJobs }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('applications');

  // Sample analytics data (would come from API in real implementation)
  const hiringFunnelData = [
    { month: 'Jan', applications: 45, screened: 25, interviewed: 12, offered: 6, hired: 4 },
    { month: 'Feb', applications: 52, screened: 30, interviewed: 15, offered: 8, hired: 5 },
    { month: 'Mar', applications: 38, screened: 22, interviewed: 10, offered: 5, hired: 3 },
    { month: 'Apr', applications: 61, screened: 35, interviewed: 18, offered: 10, hired: 7 },
    { month: 'May', applications: 48, screened: 28, interviewed: 14, offered: 7, hired: 5 },
    { month: 'Jun', applications: 55, screened: 32, interviewed: 16, offered: 9, hired: 6 },
  ];

  const jobPerformanceData = myJobs?.map(job => ({
    title: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
    applications: job.applicationCount || 0,
    views: job.viewCount || 0,
    conversionRate: job.viewCount > 0 ? ((job.applicationCount || 0) / job.viewCount * 100) : 0,
    avgMatchScore: 75 + Math.random() * 20 // Mock data
  })) || [];

  const skillDemandData = [
    { skill: 'JavaScript', demand: 95, filled: 80 },
    { skill: 'React', demand: 88, filled: 75 },
    { skill: 'Python', demand: 92, filled: 70 },
    { skill: 'AWS', demand: 85, filled: 60 },
    { skill: 'Node.js', demand: 82, filled: 85 },
    { skill: 'Docker', demand: 78, filled: 65 },
  ];

  const applicationSourceData = [
    { source: 'AI Matching', count: 120, color: '#f97316' },
    { source: 'Direct Apply', count: 85, color: '#eab308' },
    { source: 'Referrals', count: 45, color: '#22c55e' },
    { source: 'Job Boards', count: 30, color: '#0ea5e9' },
  ];

  const timeToHireData = [
    { position: 'Software Engineer', avgDays: 25, targetDays: 30 },
    { position: 'Product Manager', avgDays: 35, targetDays: 45 },
    { position: 'Data Scientist', avgDays: 28, targetDays: 35 },
    { position: 'UX Designer', avgDays: 22, targetDays: 25 },
  ];

  // Calculate key metrics
  const totalApplications = hiringFunnelData.reduce((sum, item) => sum + item.applications, 0);
  const totalHired = hiringFunnelData.reduce((sum, item) => sum + item.hired, 0);
  const avgTimeToHire = timeToHireData.reduce((sum, item) => sum + item.avgDays, 0) / timeToHireData.length;
  const hiringRate = totalApplications > 0 ? (totalHired / totalApplications) * 100 : 0;

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
      {/* Analytics Header */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hiring Analytics</h3>
            <p className="text-gray-600 mt-1">Performance metrics and insights for your hiring process</p>
          </div>
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-primary-600 mb-1">{totalApplications}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
            <div className="flex items-center justify-center mt-2 text-xs text-success-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +15% vs last period
            </div>
          </div>

          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <div className="w-12 h-12 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-secondary-600 mb-1">{totalHired}</div>
            <div className="text-sm text-gray-600">Candidates Hired</div>
            <div className="flex items-center justify-center mt-2 text-xs text-success-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8% vs last period
            </div>
          </div>

          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-accent-600 mb-1">
              {formatPercentage(hiringRate, 1)}
            </div>
            <div className="text-sm text-gray-600">Hiring Rate</div>
            <div className="flex items-center justify-center mt-2 text-xs text-success-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              Above industry avg
            </div>
          </div>

          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="w-12 h-12 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-success-600 mb-1">{Math.round(avgTimeToHire)}</div>
            <div className="text-sm text-gray-600">Avg Days to Hire</div>
            <div className="flex items-center justify-center mt-2 text-xs text-success-600">
              <TrendingDown className="w-3 h-3 mr-1" />
              -3 days improved
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hiring Funnel Chart */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hiring Funnel</h3>
            <p className="text-gray-600 mt-1">Track candidates through your hiring process</p>
          </div>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hiringFunnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              <Bar dataKey="applications" fill="#f97316" radius={[2, 2, 0, 0]} />
              <Bar dataKey="screened" fill="#eab308" radius={[2, 2, 0, 0]} />
              <Bar dataKey="interviewed" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
              <Bar dataKey="offered" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="hired" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
          {[
            { key: 'applications', label: 'Applications', color: '#f97316' },
            { key: 'screened', label: 'Screened', color: '#eab308' },
            { key: 'interviewed', label: 'Interviewed', color: '#0ea5e9' },
            { key: 'offered', label: 'Offered', color: '#22c55e' },
            { key: 'hired', label: 'Hired', color: '#8b5cf6' }
          ].map(item => (
            <div key={item.key} className="flex items-center">
              <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: item.color }}></div>
              <span className="text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Performance */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Job Performance</h3>
              <p className="text-gray-600 mt-1">Application rates by job posting</p>
            </div>
            <Briefcase className="w-5 h-5 text-gray-400" />
          </div>

          {jobPerformanceData.length > 0 ? (
            <div className="space-y-4">
              {jobPerformanceData.slice(0, 5).map((job, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{job.title}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>{job.applications} applications</span>
                      <span>•</span>
                      <span>{job.views} views</span>
                      <span>•</span>
                      <span>{job.conversionRate.toFixed(1)}% conversion</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-accent-600">
                      {Math.round(job.avgMatchScore)}%
                    </div>
                    <div className="text-xs text-gray-500">Avg Match</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No job performance data available</p>
            </div>
          )}
        </motion.div>

        {/* Application Sources */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Application Sources</h3>
              <p className="text-gray-600 mt-1">Where candidates are coming from</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-gray-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={applicationSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {applicationSourceData.map((entry, index) => (
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
            {applicationSourceData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600">{item.source}</span>
                </div>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Skills Demand Analysis */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Skills Demand vs Supply</h3>
            <p className="text-gray-600 mt-1">Market demand vs candidate availability</p>
          </div>
          <Target className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {skillDemandData.map((skill, index) => (
            <motion.div
              key={skill.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{skill.skill}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-primary-600">Demand: {skill.demand}%</span>
                  <span className="text-secondary-600">Supply: {skill.filled}%</span>
                </div>
              </div>
              
              <div className="relative">
                {/* Demand bar (background) */}
                <div className="progress h-3 bg-gray-200">
                  <div 
                    className="h-full bg-primary-200 rounded-full"
                    style={{ width: `${skill.demand}%` }}
                  />
                </div>
                {/* Supply bar (foreground) */}
                <div className="absolute top-0 left-0 progress h-3 bg-transparent">
                  <motion.div
                    className="h-full bg-secondary-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.filled}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Market demand</span>
                <span className={cn(
                  "font-medium",
                  skill.filled < skill.demand ? "text-warning-600" : "text-success-600"
                )}>
                  {skill.filled < skill.demand ? 'High demand' : 'Well supplied'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Time to Hire Analysis */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Time to Hire</h3>
            <p className="text-gray-600 mt-1">Average hiring timeline by position</p>
          </div>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {timeToHireData.map((position, index) => {
            const isUnderTarget = position.avgDays <= position.targetDays;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{position.position}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm">
                    <span className="text-gray-600">
                      Avg: <span className="font-medium">{position.avgDays} days</span>
                    </span>
                    <span className="text-gray-600">
                      Target: <span className="font-medium">{position.targetDays} days</span>
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  isUnderTarget 
                    ? "bg-success-100 text-success-700" 
                    : "bg-warning-100 text-warning-700"
                )}>
                  {isUnderTarget ? 'On Track' : 'Needs Improvement'}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Weekly Summary */}
      <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-success-50 to-success-100 border-success-200">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-success-500 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-success-900 mb-2">This Week's Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-success-800">
              <div>
                <div className="font-medium">Jobs Posted</div>
                <div className="text-2xl font-bold">3</div>
              </div>
              <div>
                <div className="font-medium">New Applications</div>
                <div className="text-2xl font-bold">28</div>
              </div>
              <div>
                <div className="font-medium">Interviews Scheduled</div>
                <div className="text-2xl font-bold">12</div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-success-700">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>25% increase in quality applications this week</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-accent-50 to-accent-100 border-accent-200">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-accent-900 mb-2">AI Hiring Insights</h4>
            <div className="space-y-2 text-sm text-accent-800">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>Your hiring rate is 12% above industry average</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>Consider expanding search radius for Python developers</span>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                <span>Your job descriptions have 85% ATS compatibility</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecruiterAnalytics;
