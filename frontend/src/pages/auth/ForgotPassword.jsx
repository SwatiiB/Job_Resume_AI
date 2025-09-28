import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { authAPI } from '../../services/api';
import { cn } from '../../utils/cn';

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      clearErrors();

      await authAPI.forgotPassword({ email: data.email });

      setEmailSent(true);
      setSentEmail(data.email);
      toast.success('Password reset instructions sent to your email!');

    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.response?.status === 404) {
        setError('email', {
          type: 'manual',
          message: 'No account found with this email address.'
        });
      } else {
        setError('root', {
          type: 'manual',
          message: error.response?.data?.error || 'Failed to send reset email. Please try again.'
        });
      }
      
      toast.error('Failed to send reset email.');
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

  if (emailSent) {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-2">
            We've sent password reset instructions to:
          </p>
          <p className="text-orange-600 font-semibold mb-6">{sentEmail}</p>
          <p className="text-sm text-gray-500 mb-6">
            If you don't see the email in your inbox, please check your spam folder.
          </p>
          
          <div className="space-y-3">
            <Link
              to="/auth/login"
              className="w-full btn btn-primary btn-md"
            >
              Back to Sign In
            </Link>
            <button
              onClick={() => {
                setEmailSent(false);
                setSentEmail('');
              }}
              className="w-full btn btn-secondary btn-md"
            >
              Try Different Email
            </button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </motion.div>

        {/* Forgot Password Form */}
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
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Send Reset Email Button */}
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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reset Instructions
                </>
              )}
            </motion.button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          variants={cardVariants}
          className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">
            Need Help?
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Check your spam/junk folder if you don't receive the email</p>
            <p>• Reset links expire after 1 hour for security</p>
            <p>• Still having trouble? <Link to="/support" className="text-orange-600 hover:text-orange-500 font-medium">Contact Support</Link></p>
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

export default ForgotPassword;
