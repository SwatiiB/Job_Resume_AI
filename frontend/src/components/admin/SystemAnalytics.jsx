import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase,
  Bell,
  Activity,
  Calendar,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Eye
} from 'lucide-react';

import { adminAPI } from '../../services/api';
import { cn } from '../../utils/cn';
import { formatPercentage, formatNumber } from '../../utils/formatters';

const SystemAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('users');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery(
    ['admin-analytics', timeRange],
    () => adminAPI.getSystemAnalytics({ timeRange }),
    {
      select: (response) => response.data.data,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Sample analytics data (would come from API)
  const userGrowthData = [
    { month: 'Jan', candidates: 45, recruiters: 12, total: 57 },
    { month: 'Feb', candidates: 78, recruiters: 18, total: 96 },
    { month: 'Mar', candidates: 123, recruiters: 25, total: 148 },
    { month: 'Apr', candidates: 189, recruiters: 34, total: 223 },
    { month: 'May', candidates: 267, recruiters: 45, total: 312 },
    { month: 'Jun', candidates: 345, recruiters: 58, total: 403 },
  ];

  const jobPostingData = [
    { month: 'Jan', active: 25, draft: 8, closed: 12 },
    { month: 'Feb', active: 42, draft: 15, closed: 18 },
    { month: 'Mar', active: 38, draft: 12, closed: 25 },
    { month: 'Apr', active: 67, draft: 22, closed: 31 },
    { month: 'May', active: 54, draft: 18, closed: 28 },
    { month: 'Jun', active: 73, draft: 25, closed: 35 },
  ];

  const notificationData = [
    { type: 'Job Matches', count: 1250, color: '#f97316' },
    { type: 'OTP Verification', count: 890, color: '#eab308' },
    { type: 'Interview Scheduled', count: 456, color: '#22c55e' },
    { type: 'Application Status', count: 324, color: '#0ea5e9' },
    { type: 'Welcome', count: 234, color: '#8b5cf6' },
    { type: 'Password Reset', count: 123, color: '#ef4444' },
  ];

  const resumeActivityData = [
    { week: 'Week 1', uploads: 45, refreshes: 23, downloads: 67 },
    { week: 'Week 2', uploads: 52, refreshes: 31, downloads: 78 },
    { week: 'Week 3', uploads: 38, refreshes: 19, downloads: 54 },
    { week: 'Week 4', uploads: 61, refreshes: 42, downloads: 89 },
  ];

  const systemPerformanceData = [
    { time: '00:00', cpu: 45, memory: 62, disk: 34, network: 23 },
    { time: '04:00', cpu: 38, memory: 58, disk: 36, network: 28 },
    { time: '08:00', cpu: 72, memory: 78, disk: 42, network: 45 },
    { time: '12:00', cpu: 85, memory: 82, disk: 48, network: 67 },
    { time: '16:00', cpu: 91, memory: 89, disk: 52, network: 78 },
    { time: '20:00', cpu: 67, memory: 74, disk: 45, network: 56 },
  ];

  const topMetrics = {
    totalUsers: analyticsData?.totalUsers || 1247,
    userGrowth: analyticsData?.userGrowth || 12.5,
    totalJobs: analyticsData?.totalJobs || 389,
    jobGrowth: analyticsData?.jobGrowth || 8.7,
    totalNotifications: analyticsData?.totalNotifications || 3456,
    notificationGrowth: analyticsData?.notificationGrowth || 15.2,
    systemUptime: analyticsData?.systemUptime || 99.8
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
      {/* Analytics Header */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Analytics</h3>
            <p className="text-gray-600 mt-1">Comprehensive platform insights and performance metrics</p>
          </div>
          
          <div className="flex items-center space-x-3">
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
            
            <button className="btn btn-secondary btn-sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            
            <button className="btn btn-primary btn-sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-primary-600 mb-1">{formatNumber(topMetrics.totalUsers)}</div>
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="flex items-center justify-center mt-2 text-xs">
              {topMetrics.userGrowth > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-success-600" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-error-600" />
              )}
              <span className={topMetrics.userGrowth > 0 ? "text-success-600" : "text-error-600"}>
                {Math.abs(topMetrics.userGrowth)}% vs last period
              </span>
            </div>
          </div>

          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <div className="w-12 h-12 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-secondary-600 mb-1">{formatNumber(topMetrics.totalJobs)}</div>
            <div className="text-sm text-gray-600">Active Jobs</div>
            <div className="flex items-center justify-center mt-2 text-xs">
              {topMetrics.jobGrowth > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-success-600" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-error-600" />
              )}
              <span className={topMetrics.jobGrowth > 0 ? "text-success-600" : "text-error-600"}>
                {Math.abs(topMetrics.jobGrowth)}% vs last period
              </span>
            </div>
          </div>

          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-accent-600 mb-1">{formatNumber(topMetrics.totalNotifications)}</div>
            <div className="text-sm text-gray-600">Notifications Sent</div>
            <div className="flex items-center justify-center mt-2 text-xs">
              {topMetrics.notificationGrowth > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-success-600" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-error-600" />
              )}
              <span className={topMetrics.notificationGrowth > 0 ? "text-success-600" : "text-error-600"}>
                {Math.abs(topMetrics.notificationGrowth)}% vs last period
              </span>
            </div>
          </div>

          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="w-12 h-12 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-success-600 mb-1">{topMetrics.systemUptime}%</div>
            <div className="text-sm text-gray-600">System Uptime</div>
            <div className="flex items-center justify-center mt-2 text-xs text-success-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              Above 99.5% target
            </div>
          </div>
        </div>
      </motion.div>

      {/* User Growth Chart */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
            <p className="text-gray-600 mt-1">New user registrations over time</p>
          </div>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              <Line 
                type="monotone" 
                dataKey="candidates" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="recruiters" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <span className="text-gray-600">Candidates</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-gray-600">Recruiters</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Posting Trends */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Job Posting Trends</h3>
              <p className="text-gray-600 mt-1">Monthly job posting activity</p>
            </div>
            <Briefcase className="w-5 h-5 text-gray-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobPostingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                <Bar dataKey="active" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="draft" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
                <Bar dataKey="closed" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
              <span className="text-gray-600">Active</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-yellow-500 mr-2"></div>
              <span className="text-gray-600">Draft</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-red-500 mr-2"></div>
              <span className="text-gray-600">Closed</span>
            </div>
          </div>
        </motion.div>

        {/* Notification Distribution */}
        <motion.div variants={cardVariants} className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notification Distribution</h3>
              <p className="text-gray-600 mt-1">Breakdown by notification type</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-gray-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={notificationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {notificationData.map((entry, index) => (
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

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            {notificationData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600 truncate">{item.type}</span>
                </div>
                <span className="font-medium text-gray-900">{formatNumber(item.count)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Resume Activity */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Resume Activity</h3>
            <p className="text-gray-600 mt-1">Weekly resume uploads, refreshes, and downloads</p>
          </div>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={resumeActivityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="week" 
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
              <Area
                type="monotone"
                dataKey="uploads"
                stackId="1"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="refreshes"
                stackId="1"
                stroke="#eab308"
                fill="#eab308"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="downloads"
                stackId="1"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-orange-500 mr-2"></div>
            <span className="text-gray-600">Uploads</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-yellow-500 mr-2"></div>
            <span className="text-gray-600">Refreshes</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
            <span className="text-gray-600">Downloads</span>
          </div>
        </div>
      </motion.div>

      {/* System Performance */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
            <p className="text-gray-600 mt-1">Real-time system resource utilization</p>
          </div>
          <Server className="w-5 h-5 text-gray-400" />
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={systemPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`${value}%`, '']}
              />
              <Line 
                type="monotone" 
                dataKey="cpu" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="memory" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="disk" 
                stroke="#eab308" 
                strokeWidth={2}
                dot={{ fill: '#eab308', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="network" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-error-50 rounded-lg">
            <Cpu className="w-5 h-5 text-error-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-error-600">78%</div>
            <div className="text-xs text-gray-600">CPU Usage</div>
          </div>
          
          <div className="text-center p-3 bg-warning-50 rounded-lg">
            <Database className="w-5 h-5 text-warning-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-warning-600">65%</div>
            <div className="text-xs text-gray-600">Memory</div>
          </div>
          
          <div className="text-center p-3 bg-secondary-50 rounded-lg">
            <HardDrive className="w-5 h-5 text-secondary-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-secondary-600">42%</div>
            <div className="text-xs text-gray-600">Disk Usage</div>
          </div>
          
          <div className="text-center p-3 bg-success-50 rounded-lg">
            <Wifi className="w-5 h-5 text-success-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-success-600">34%</div>
            <div className="text-xs text-gray-600">Network</div>
          </div>
        </div>
      </motion.div>

      {/* Platform Insights */}
      <motion.div variants={cardVariants} className="dashboard-card bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-primary-900 mb-2">Platform Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-primary-800">
              <div>
                <div className="font-medium mb-1">Peak Usage</div>
                <div className="text-xs text-primary-700">
                  Most activity occurs between 2-4 PM EST with 85% of daily traffic
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">User Engagement</div>
                <div className="text-xs text-primary-700">
                  Average session duration: 12 minutes, 78% return rate
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">System Health</div>
                <div className="text-xs text-primary-700">
                  99.8% uptime, average response time: 245ms
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-primary-700">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>User growth is 23% above industry average</span>
              </div>
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                <span>AI matching accuracy improved by 15% this month</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SystemAnalytics;
