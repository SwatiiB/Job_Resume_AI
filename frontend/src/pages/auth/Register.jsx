import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus,
  AlertCircle,
  ArrowRight,
  User,
  Users,
  Briefcase,
  CheckCircle2,
  Shield,
  Phone,
  MapPin,
  Building,
  Globe,
  Upload,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { authAPI } from '../../services/api';
import { cn } from '../../utils/cn';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState('candidate');
  const [skills, setSkills] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      role: 'candidate',
      experienceLevel: 'entry',
      country: 'United States'
    }
  });

  // Predefined skill options for candidates
  const skillOptions = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
    'TypeScript', 'PHP', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift',
    'HTML/CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'Jenkins',
    'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication',
    'Data Analysis', 'Machine Learning', 'UI/UX Design', 'Digital Marketing'
  ];

  // Experience level options
  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (2-5 years)' },
    { value: 'senior', label: 'Senior Level (5-10 years)' },
    { value: 'lead', label: 'Lead/Principal (10+ years)' },
    { value: 'executive', label: 'Executive Level' }
  ];

  const watchPassword = watch('password');

  // Handle role change
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setValue('role', role);
    
    // Clear role-specific errors when switching roles
    clearErrors();
    
    // Reset role-specific fields
    if (role !== 'candidate') {
      setSkills([]);
      setResumeFile(null);
    }
  };

  // Handle skill addition
  const addSkill = (skill) => {
    if (skill && !skills.includes(skill)) {
      const newSkills = [...skills, skill];
      setSkills(newSkills);
      setSkillInput('');
    }
  };

  // Handle skill removal
  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Handle resume file upload
  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('resume', {
          type: 'manual',
          message: 'Please upload a PDF or Word document'
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('resume', {
          type: 'manual',
          message: 'File size must be less than 5MB'
        });
        return;
      }
      
      setResumeFile(file);
      clearErrors('resume');
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      clearErrors();

      // Prepare form data for multipart upload if resume is included
      const formData = new FormData();
      
      // Basic user data
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('role', data.role);

      // Role-specific data
      if (data.role === 'candidate') {
        formData.append('phone', data.phone || '');
        formData.append('skills', JSON.stringify(skills));
        formData.append('experienceLevel', data.experienceLevel);
        formData.append('city', data.city || '');
        formData.append('state', data.state || '');
        formData.append('country', data.country || 'United States');
        
        if (resumeFile) {
          formData.append('resume', resumeFile);
        }
      } else if (data.role === 'recruiter') {
        formData.append('companyName', data.companyName);
        formData.append('companyWebsite', data.companyWebsite || '');
        formData.append('position', data.position);
        formData.append('contactNumber', data.contactNumber);
      }

      const response = await authAPI.register(formData);

      setRegistrationSuccess(true);
      toast.success('Registration successful! Please check your email to verify your account.');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login', { 
          state: { message: 'Registration successful! Please sign in with your credentials.' }
        });
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        setError('email', {
          type: 'manual',
          message: 'An account with this email already exists.'
        });
      } else if (error.response?.data?.errors) {
        // Handle validation errors from backend
        Object.keys(error.response.data.errors).forEach(field => {
          setError(field, {
            type: 'manual',
            message: error.response.data.errors[field]
          });
        });
      } else {
        setError('root', {
          type: 'manual',
          message: error.response?.data?.error || 'Registration failed. Please try again.'
        });
      }
      
      toast.error('Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.2
      }
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account.
          </p>
          <div className="text-sm text-gray-500">
            Redirecting to login page in a few seconds...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          variants={cardVariants}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">RR</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Resume Refresh</h1>
          <p className="text-gray-600">Create your account and start your career journey</p>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {errors.root && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{errors.root.message}</span>
              </motion.div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative">
                  <input
                    {...register('role')}
                    type="radio"
                    value="candidate"
                    checked={selectedRole === 'candidate'}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="sr-only peer"
                  />
                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-orange-500 peer-checked:bg-orange-50 transition-all">
                    <Users className={cn("w-5 h-5", selectedRole === 'candidate' ? "text-orange-600" : "text-gray-400")} />
                    <span className={cn("text-sm font-medium", selectedRole === 'candidate' ? "text-orange-700" : "text-gray-700")}>
                      Job Seeker
                    </span>
                  </div>
                </label>
                
                <label className="relative">
                  <input
                    {...register('role')}
                    type="radio"
                    value="recruiter"
                    checked={selectedRole === 'recruiter'}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="sr-only peer"
                  />
                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-orange-500 peer-checked:bg-orange-50 transition-all">
                    <Briefcase className={cn("w-5 h-5", selectedRole === 'recruiter' ? "text-orange-600" : "text-gray-400")} />
                    <span className={cn("text-sm font-medium", selectedRole === 'recruiter' ? "text-orange-700" : "text-gray-700")}>
                      Recruiter
                    </span>
                  </div>
                </label>
              </div>
              
              {/* Admin Registration Notice */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">
                  Admin accounts can only be created by existing administrators
                </span>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  id="firstName"
                  autoComplete="given-name"
                  className={cn(
                    "block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors",
                    errors.firstName && "border-red-300 focus:ring-red-500 focus:border-red-500"
                  )}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  id="lastName"
                  autoComplete="family-name"
                  className={cn(
                    "block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors",
                    errors.lastName && "border-red-300 focus:ring-red-500 focus:border-red-500"
                  )}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  type="email"
                  id="email"
                  autoComplete="email"
                  className={cn(
                    "block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors",
                    errors.email && "border-red-300 focus:ring-red-500 focus:border-red-500"
                  )}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  className={cn(
                    "block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors",
                    errors.password && "border-red-300 focus:ring-red-500 focus:border-red-500"
                  )}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === watchPassword || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  className={cn(
                    "block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors",
                    errors.confirmPassword && "border-red-300 focus:ring-red-500 focus:border-red-500"
                  )}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Role-Specific Fields */}
            {selectedRole === 'candidate' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 border-t border-gray-200 pt-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-orange-600" />
                  Job Seeker Information
                </h3>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('phone')}
                      type="tel"
                      id="phone"
                      autoComplete="tel"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      id="city"
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="San Francisco"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      {...register('state')}
                      type="text"
                      id="state"
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="CA"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      {...register('country')}
                      type="text"
                      id="country"
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="United States"
                    />
                  </div>
                </div>

                {/* Experience Level */}
                <div className="space-y-2">
                  <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700">
                    Experience Level
                  </label>
                  <select
                    {...register('experienceLevel')}
                    id="experienceLevel"
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  >
                    {experienceLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Skills
                  </label>
                  <div className="space-y-3">
                    {/* Skill Input */}
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill(skillInput);
                            }
                          }}
                          className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          placeholder="Type a skill and press Enter"
                          list="skills-datalist"
                        />
                        <datalist id="skills-datalist">
                          {skillOptions.map((skill) => (
                            <option key={skill} value={skill} />
                          ))}
                        </datalist>
                      </div>
                      <button
                        type="button"
                        onClick={() => addSkill(skillInput)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Selected Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-2 hover:text-orange-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Popular Skills */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Popular skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {skillOptions.slice(0, 8).map((skill) => (
                          !skills.includes(skill) && (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => addSkill(skill)}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                            >
                              + {skill}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resume Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Resume Upload (Optional)
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                    {resumeFile ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{resumeFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setResumeFile(null);
                            clearErrors('resume');
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX up to 5MB
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  {errors.resume && (
                    <p className="text-red-600 text-sm mt-1">{errors.resume.message}</p>
                  )}
                </div>
              </motion.div>
            )}

            {selectedRole === 'recruiter' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 border-t border-gray-200 pt-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-orange-600" />
                  Recruiter Information
                </h3>

                {/* Company Name */}
                <div className="space-y-2">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('companyName', {
                        required: selectedRole === 'recruiter' ? 'Company name is required' : false
                      })}
                      type="text"
                      id="companyName"
                      className={cn(
                        "block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors",
                        errors.companyName && "border-red-300 focus:ring-red-500 focus:border-red-500"
                      )}
                      placeholder="Acme Corporation"
                    />
                  </div>
                  {errors.companyName && (
                    <p className="text-red-600 text-sm mt-1">{errors.companyName.message}</p>
                  )}
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Your Position *
                  </label>
                  <input
                    {...register('position', {
                      required: selectedRole === 'recruiter' ? 'Position is required' : false
                    })}
                    type="text"
                    id="position"
                    className={cn(
                      "block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors",
                      errors.position && "border-red-300 focus:ring-red-500 focus:border-red-500"
                    )}
                    placeholder="HR Manager, Talent Acquisition Specialist, etc."
                  />
                  {errors.position && (
                    <p className="text-red-600 text-sm mt-1">{errors.position.message}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                    Contact Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('contactNumber', {
                        required: selectedRole === 'recruiter' ? 'Contact number is required' : false
                      })}
                      type="tel"
                      id="contactNumber"
                      className={cn(
                        "block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors",
                        errors.contactNumber && "border-red-300 focus:ring-red-500 focus:border-red-500"
                      )}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="text-red-600 text-sm mt-1">{errors.contactNumber.message}</p>
                  )}
                </div>

                {/* Company Website */}
                <div className="space-y-2">
                  <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                    Company Website
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('companyWebsite')}
                      type="url"
                      id="companyWebsite"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="https://www.company.com"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                {...register('acceptTerms', {
                  required: 'You must accept the terms and conditions'
                })}
                id="acceptTerms"
                type="checkbox"
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                I agree to the{' '}
                <Link to="/terms" className="text-orange-600 hover:text-orange-500 font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-orange-600 hover:text-orange-500 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-red-600 text-sm mt-1">{errors.acceptTerms.message}</p>
            )}

            {/* Register Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200",
                isLoading && "opacity-75 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {selectedRole === 'candidate' ? 'Create Job Seeker Account' : 
                   selectedRole === 'recruiter' ? 'Create Recruiter Account' : 
                   'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </motion.button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={cardVariants}
          className="mt-8 text-center text-xs text-gray-500"
        >
          <p>© 2024 Resume Refresh Platform. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
