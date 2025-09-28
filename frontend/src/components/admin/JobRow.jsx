import React from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Users, 
  Calendar,
  CheckCircle2,
  XCircle,
  Flag,
  Eye
} from 'lucide-react';

import { cn } from '../../utils/cn';
import { 
  formatRelativeTime, 
  formatWorkMode,
  getStatusBadgeProps 
} from '../../utils/formatters';

const JobRow = ({ job, onAction }) => {
  const statusBadge = getStatusBadgeProps(job.status);
  
  const getModerationBadge = (status) => {
    switch (status) {
      case 'approved':
        return { className: 'bg-success-100 text-success-700', text: 'Approved' };
      case 'rejected':
        return { className: 'bg-error-100 text-error-700', text: 'Rejected' };
      case 'flagged':
        return { className: 'bg-warning-100 text-warning-700', text: 'Flagged' };
      case 'pending':
      default:
        return { className: 'bg-gray-100 text-gray-700', text: 'Pending' };
    }
  };

  const moderationBadge = getModerationBadge(job.moderationStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-card card-hover"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{job.title}</h4>
              <div className="flex items-center space-x-2">
                <span className={cn("badge", statusBadge.className)}>
                  {statusBadge.text}
                </span>
                <span className={cn("badge", moderationBadge.className)}>
                  {moderationBadge.text}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2" />
                {job.company.name}
              </div>
              
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {job.location.city}, {job.location.state} • {formatWorkMode(job.location.workMode)}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {job.applicationCount || 0} applications
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatRelativeTime(job.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {job.moderationStatus === 'pending' && (
                <>
                  <button
                    onClick={() => onAction('approve', job._id)}
                    className="btn btn-success btn-sm"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => onAction('reject', job._id)}
                    className="btn btn-error btn-sm"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </button>
                </>
              )}
              
              <button
                onClick={() => onAction('flag', job._id)}
                className="btn btn-warning btn-sm"
              >
                <Flag className="w-3 h-3 mr-1" />
                Flag
              </button>
              
              <button
                onClick={() => onAction('view', job._id)}
                className="btn btn-secondary btn-sm"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JobRow;
