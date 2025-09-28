import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit3,
  Trash2,
  MoreHorizontal,
  Eye,
  Key,
  Ban,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

import { adminAPI, usersAPI } from '../../services/api';
import { cn } from '../../utils/cn';
import { 
  formatRelativeTime, 
  formatUserRole,
  getUserStatusBadge 
} from '../../utils/formatters';
import UserCard from './UserCard';

const UserManagement = () => {
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: usersData, isLoading, refetch } = useQuery(
    ['admin-users', filters],
    () => adminAPI.getAllUsers({
      role: filters.role !== 'all' ? filters.role : undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      search: filters.search || undefined,
      limit: 100
    }),
    {
      select: (response) => response.data,
      staleTime: 2 * 60 * 1000,
    }
  );

  // User actions mutations
  const activateUserMutation = useMutation(
    (userId) => adminAPI.activateUser(userId),
    {
      onSuccess: () => {
        toast.success('User activated successfully');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to activate user');
      },
    }
  );

  const deactivateUserMutation = useMutation(
    (userId) => adminAPI.deactivateUser(userId),
    {
      onSuccess: () => {
        toast.success('User deactivated successfully');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to deactivate user');
      },
    }
  );

  const resetPasswordMutation = useMutation(
    (userId) => adminAPI.resetUserPassword(userId),
    {
      onSuccess: () => {
        toast.success('Password reset email sent');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to reset password');
      },
    }
  );

  const deleteUserMutation = useMutation(
    (userId) => adminAPI.deleteUser(userId),
    {
      onSuccess: () => {
        toast.success('User deleted successfully');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete user');
      },
    }
  );

  const bulkActionMutation = useMutation(
    ({ action, userIds }) => adminAPI.bulkUserAction(action, userIds),
    {
      onSuccess: (data, variables) => {
        toast.success(`Bulk ${variables.action} completed successfully`);
        setSelectedUsers(new Set());
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Bulk action failed');
      },
    }
  );

  const users = usersData?.data || [];
  const totalUsers = usersData?.total || 0;

  const filteredUsers = users.filter(user => {
    const matchesRole = filters.role === 'all' || user.role === filters.role;
    const matchesStatus = filters.status === 'all' || user.status === filters.status;
    const matchesSearch = !filters.search || 
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.profile?.firstName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.profile?.lastName?.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  const handleUserAction = (action, userId) => {
    switch (action) {
      case 'activate':
        activateUserMutation.mutate(userId);
        break;
      case 'deactivate':
        deactivateUserMutation.mutate(userId);
        break;
      case 'resetPassword':
        resetPasswordMutation.mutate(userId);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          deleteUserMutation.mutate(userId);
        }
        break;
      default:
        break;
    }
  };

  const handleBulkAction = (action) => {
    if (selectedUsers.size === 0) {
      toast.error('Please select users first');
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedUsers.size} users?`;
    if (window.confirm(confirmMessage)) {
      bulkActionMutation.mutate({
        action,
        userIds: Array.from(selectedUsers)
      });
    }
  };

  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (selectedUsers.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user._id)));
    }
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
      {/* User Management Header */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <p className="text-gray-600 mt-1">
              {totalUsers} total users • {filteredUsers.length} shown
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button className="btn btn-secondary btn-sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button className="btn btn-primary btn-sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 input"
            />
          </div>
          
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="input"
          >
            <option value="all">All Roles</option>
            <option value="candidate">Candidates</option>
            <option value="recruiter">Recruiters</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending Verification</option>
          </select>

          <button
            onClick={() => setFilters({ role: 'all', status: 'all', search: '' })}
            className="btn btn-secondary btn-md"
          >
            Clear Filters
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-lg mb-6"
          >
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-primary-900">
                {selectedUsers.size} users selected
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="btn btn-success btn-sm"
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="btn btn-warning btn-sm"
              >
                <UserX className="w-4 h-4 mr-1" />
                Deactivate
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

      {/* User Statistics */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {users.filter(u => u.role === 'candidate').length}
            </div>
            <div className="text-sm text-gray-600">Candidates</div>
          </div>

          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <div className="text-2xl font-bold text-secondary-600 mb-1">
              {users.filter(u => u.role === 'recruiter').length}
            </div>
            <div className="text-sm text-gray-600">Recruiters</div>
          </div>

          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600 mb-1">
              {users.filter(u => u.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>

          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <div className="text-2xl font-bold text-warning-600 mb-1">
              {users.filter(u => u.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Verification</div>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Last Active</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
                    <p className="text-gray-600">Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    index={index}
                    isSelected={selectedUsers.has(user._id)}
                    onSelect={handleSelectUser}
                    onAction={handleUserAction}
                    onView={(user) => {
                      setSelectedUser(user);
                      setShowUserModal(true);
                    }}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                    <p className="text-gray-600">
                      {filters.search || filters.role !== 'all' || filters.status !== 'all'
                        ? 'No users match your current filters.'
                        : 'No users registered yet.'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onAction={handleUserAction}
        />
      )}
    </motion.div>
  );
};

// User Row Component
const UserRow = ({ user, index, isSelected, onSelect, onAction, onView }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusBadge = getUserStatusBadge(user.status);

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
          onChange={() => onSelect(user._id)}
          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
        />
      </td>
      
      <td className="py-3 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            {user.profile?.avatar ? (
              <img
                src={user.profile.avatar}
                alt={user.profile.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {user.profile?.fullName || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'No Name'}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      
      <td className="py-3 px-4">
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          user.role === 'admin' ? "bg-error-100 text-error-700" :
          user.role === 'recruiter' ? "bg-secondary-100 text-secondary-700" :
          "bg-primary-100 text-primary-700"
        )}>
          {formatUserRole(user.role)}
        </span>
      </td>
      
      <td className="py-3 px-4">
        <span className={cn("badge", statusBadge.className)}>
          {statusBadge.text}
        </span>
      </td>
      
      <td className="py-3 px-4 text-sm text-gray-600">
        {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}
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
                  onView(user);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 mr-3 text-gray-400" />
                View Details
              </button>
              
              <button
                onClick={() => {
                  onAction('resetPassword', user._id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Key className="w-4 h-4 mr-3 text-gray-400" />
                Reset Password
              </button>
              
              {user.status === 'active' ? (
                <button
                  onClick={() => {
                    onAction('deactivate', user._id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 transition-colors"
                >
                  <UserX className="w-4 h-4 mr-3" />
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => {
                    onAction('activate', user._id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-success-600 hover:bg-success-50 transition-colors"
                >
                  <UserCheck className="w-4 h-4 mr-3" />
                  Activate
                </button>
              )}
              
              <div className="border-t border-gray-100 my-1" />
              
              <button
                onClick={() => {
                  onAction('delete', user._id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete User
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

// User Detail Modal Component
const UserDetailModal = ({ user, onClose, onAction }) => {
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
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                {user.profile?.avatar ? (
                  <img
                    src={user.profile.avatar}
                    alt={user.profile.fullName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.profile?.fullName || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'No Name'}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    user.role === 'admin' ? "bg-error-100 text-error-700" :
                    user.role === 'recruiter' ? "bg-secondary-100 text-secondary-700" :
                    "bg-primary-100 text-primary-700"
                  )}>
                    {formatUserRole(user.role)}
                  </span>
                  <span className={cn("badge", getUserStatusBadge(user.status).className)}>
                    {getUserStatusBadge(user.status).text}
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
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <p className="font-medium">{user.profile?.phone || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <p className="font-medium">
                  {user.profile?.location ? 
                    `${user.profile.location.city}, ${user.profile.location.state}` : 
                    'Not provided'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-500">Joined:</span>
                <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Last Login:</span>
                <p className="font-medium">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Email Verified:</span>
                <p className="font-medium">
                  {user.emailVerified ? (
                    <span className="text-success-600">Verified</span>
                  ) : (
                    <span className="text-error-600">Not Verified</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Role-specific Information */}
          {user.role === 'recruiter' && user.profile?.company && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Company:</span>
                  <p className="font-medium">{user.profile.company.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Industry:</span>
                  <p className="font-medium">{user.profile.company.industry || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Company Size:</span>
                  <p className="font-medium">{user.profile.company.size || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Website:</span>
                  <p className="font-medium">
                    {user.profile.company.website ? (
                      <a 
                        href={user.profile.company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {user.profile.company.website}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Account Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">
                  {user.stats?.profileViews || 0}
                </div>
                <div className="text-sm text-gray-600">Profile Views</div>
              </div>
              <div className="text-center p-4 bg-secondary-50 rounded-lg">
                <div className="text-2xl font-bold text-secondary-600">
                  {user.stats?.loginCount || 0}
                </div>
                <div className="text-sm text-gray-600">Total Logins</div>
              </div>
              <div className="text-center p-4 bg-accent-50 rounded-lg">
                <div className="text-2xl font-bold text-accent-600">
                  {user.role === 'recruiter' ? (user.stats?.jobsPosted || 0) : (user.stats?.applicationsSubmitted || 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {user.role === 'recruiter' ? 'Jobs Posted' : 'Applications'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={() => onAction('resetPassword', user._id)}
            className="btn btn-secondary btn-md"
          >
            <Key className="w-4 h-4 mr-2" />
            Reset Password
          </button>
          
          {user.status === 'active' ? (
            <button
              onClick={() => {
                onAction('deactivate', user._id);
                onClose();
              }}
              className="btn btn-warning btn-md"
            >
              <UserX className="w-4 h-4 mr-2" />
              Deactivate User
            </button>
          ) : (
            <button
              onClick={() => {
                onAction('activate', user._id);
                onClose();
              }}
              className="btn btn-success btn-md"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Activate User
            </button>
          )}
          
          <button
            onClick={onClose}
            className="btn btn-primary btn-md"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserManagement;
