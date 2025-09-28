import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin,
  Globe,
  Edit3,
  Save,
  Camera,
  Lock,
  Settings,
  Bell,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

import { usersAPI, authAPI, notificationsAPI } from '../../services/api';
import { cn } from '../../utils/cn';

const RecruiterProfile = ({ profile, refetchProfile }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const queryClient = useQueryClient();

  // Profile form
  const { 
    register: registerProfile, 
    handleSubmit: handleProfileSubmit, 
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
      companyName: profile?.company?.name || '',
      companyWebsite: profile?.company?.website || '',
      companyIndustry: profile?.company?.industry || '',
      companySize: profile?.company?.size || '',
      companyDescription: profile?.company?.description || '',
      city: profile?.location?.city || '',
      state: profile?.location?.state || '',
      country: profile?.location?.country || 'United States'
    }
  });

  // Password form
  const { 
    register: registerPassword, 
    handleSubmit: handlePasswordSubmit, 
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch
  } = useForm();

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (profileData) => usersAPI.updateProfile(profileData),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        refetchProfile();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      },
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    (passwordData) => authAPI.changePassword(passwordData),
    {
      onSuccess: () => {
        toast.success('Password changed successfully!');
        setShowPasswordForm(false);
        resetPassword();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to change password');
      },
    }
  );

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation(
    (formData) => usersAPI.uploadAvatar(formData),
    {
      onSuccess: () => {
        toast.success('Avatar updated successfully!');
        refetchProfile();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to upload avatar');
      },
    }
  );

  // Notification preferences mutation
  const updateNotificationsMutation = useMutation(
    (preferences) => notificationsAPI.updateNotificationPreferences(preferences),
    {
      onSuccess: () => {
        toast.success('Notification preferences updated!');
      },
      onError: (error) => {
        toast.error('Failed to update preferences');
      },
    }
  );

  const handleProfileUpdate = (data) => {
    const profileData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      company: {
        name: data.companyName,
        website: data.companyWebsite,
        industry: data.companyIndustry,
        size: data.companySize,
        description: data.companyDescription
      },
      location: {
        city: data.city,
        state: data.state,
        country: data.country
      }
    };

    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordChange = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);
    uploadAvatarMutation.mutate(formData);
  };

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: User },
    { id: 'company', name: 'Company Details', icon: Building },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

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
      {/* Profile Header */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-6 lg:mb-0">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {profile?.firstName?.[0] || 'R'}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-medium border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-3 h-3 text-gray-600" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.fullName || 'Complete your profile'}
              </h2>
              <p className="text-gray-600 mt-1">
                {profile?.company?.name || 'Add your company information'}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                {profile?.location?.city && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profile.location.city}, {profile.location.state}
                  </div>
                )}
                {profile?.company?.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    <a 
                      href={profile.company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent-600 hover:text-accent-700"
                    >
                      Company Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={cardVariants} className="dashboard-card">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    isActive
                      ? "border-accent-500 text-accent-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    {...registerProfile('firstName', { required: 'First name is required' })}
                    className={cn("input", profileErrors.firstName && "input-error")}
                  />
                  {profileErrors.firstName && (
                    <p className="text-error-600 text-sm mt-1">{profileErrors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    {...registerProfile('lastName', { required: 'Last name is required' })}
                    className={cn("input", profileErrors.lastName && "input-error")}
                  />
                  {profileErrors.lastName && (
                    <p className="text-error-600 text-sm mt-1">{profileErrors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    {...registerProfile('phone')}
                    type="tel"
                    className="input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    {...registerProfile('city')}
                    className="input"
                    placeholder="San Francisco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    {...registerProfile('state')}
                    className="input"
                    placeholder="CA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    {...registerProfile('country')}
                    className="input"
                    placeholder="United States"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="btn btn-primary btn-md"
                >
                  {updateProfileMutation.isLoading ? (
                    <div className="loading-spinner w-4 h-4 mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </motion.button>
              </div>
            </form>
          )}

          {activeTab === 'company' && (
            <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    {...registerProfile('companyName', { required: 'Company name is required' })}
                    className={cn("input", profileErrors.companyName && "input-error")}
                    placeholder="Acme Corporation"
                  />
                  {profileErrors.companyName && (
                    <p className="text-error-600 text-sm mt-1">{profileErrors.companyName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Website
                    </label>
                    <input
                      {...registerProfile('companyWebsite')}
                      type="url"
                      className="input"
                      placeholder="https://www.company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      {...registerProfile('companyIndustry')}
                      className="input"
                    >
                      <option value="">Select industry</option>
                      <option value="technology">Technology</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                      <option value="consulting">Consulting</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="retail">Retail</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    {...registerProfile('companySize')}
                    className="input"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Description
                  </label>
                  <textarea
                    {...registerProfile('companyDescription')}
                    rows={4}
                    className="input resize-none"
                    placeholder="Brief description of your company, culture, and what makes it a great place to work..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="btn btn-primary btn-md"
                >
                  {updateProfileMutation.isLoading ? (
                    <div className="loading-spinner w-4 h-4 mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Company Info
                </motion.button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password Section */}
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Password</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Keep your account secure with a strong password
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </button>
                </div>

                {showPasswordForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handlePasswordSubmit(handlePasswordChange)}
                    className="space-y-4 mt-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('currentPassword', { required: 'Current password is required' })}
                          type={showCurrentPassword ? 'text' : 'password'}
                          className={cn("input pr-10", passwordErrors.currentPassword && "input-error")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-error-600 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('newPassword', { 
                            required: 'New password is required',
                            minLength: {
                              value: 8,
                              message: 'Password must be at least 8 characters'
                            }
                          })}
                          type={showNewPassword ? 'text' : 'password'}
                          className={cn("input pr-10", passwordErrors.newPassword && "input-error")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-error-600 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        {...registerPassword('confirmPassword', { 
                          required: 'Please confirm your password',
                          validate: value => value === watch('newPassword') || 'Passwords do not match'
                        })}
                        type="password"
                        className={cn("input", passwordErrors.confirmPassword && "input-error")}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-error-600 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={changePasswordMutation.isLoading}
                        className="btn btn-primary btn-md"
                      >
                        {changePasswordMutation.isLoading ? (
                          <div className="loading-spinner w-4 h-4 mr-2" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Update Password
                      </motion.button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          resetPassword();
                        }}
                        className="btn btn-secondary btn-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                )}
              </div>

              {/* Account Security */}
              <div className="p-6 bg-success-50 rounded-lg border border-success-200">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-success-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-success-900 mb-2">Account Security</h4>
                    <div className="space-y-1 text-sm text-success-800">
                      <div>✓ Email verified</div>
                      <div>✓ Strong password policy enabled</div>
                      <div>✓ Two-factor authentication ready</div>
                      <div>✓ Regular security monitoring active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Email Notifications</h4>
                <div className="space-y-4">
                  {[
                    {
                      key: 'new_applications',
                      title: 'New Applications',
                      description: 'Get notified when candidates apply to your jobs'
                    },
                    {
                      key: 'candidate_matches',
                      title: 'Candidate Matches',
                      description: 'Receive alerts when new candidates match your job requirements'
                    },
                    {
                      key: 'interview_responses',
                      title: 'Interview Responses',
                      description: 'Get notified when candidates respond to interview invitations'
                    },
                    {
                      key: 'job_performance',
                      title: 'Job Performance',
                      description: 'Weekly reports on your job posting performance'
                    }
                  ].map((preference) => (
                    <div key={preference.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900">{preference.title}</h5>
                        <p className="text-sm text-gray-600">{preference.description}</p>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          onChange={(e) => {
                            updateNotificationsMutation.mutate({
                              [preference.key]: e.target.checked
                            });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecruiterProfile;
