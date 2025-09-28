import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

import { cn } from '../../utils/cn';
import { formatRelativeTime, formatUserRole, getUserStatusBadge } from '../../utils/formatters';

const UserCard = ({ user, onAction }) => {
  const statusBadge = getUserStatusBadge(user.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-card card-hover"
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
          {user.profile?.avatar ? (
            <img
              src={user.profile.avatar}
              alt={user.profile.fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-lg">
              {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">
              {user.profile?.fullName || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'No Name'}
            </h4>
            <span className={cn("badge", statusBadge.className)}>
              {statusBadge.text}
            </span>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              {user.email}
            </div>
            
            {user.profile?.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {user.profile.location.city}, {user.profile.location.state}
              </div>
            )}
            
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Joined {formatRelativeTime(user.createdAt)}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              user.role === 'admin' ? "bg-error-100 text-error-700" :
              user.role === 'recruiter' ? "bg-secondary-100 text-secondary-700" :
              "bg-primary-100 text-primary-700"
            )}>
              {formatUserRole(user.role)}
            </span>

            <div className="flex items-center space-x-2">
              {user.status === 'active' ? (
                <button
                  onClick={() => onAction('deactivate', user._id)}
                  className="btn btn-warning btn-sm"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => onAction('activate', user._id)}
                  className="btn btn-success btn-sm"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Activate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;
