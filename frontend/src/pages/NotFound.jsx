import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Home, 
  ArrowLeft, 
  Search,
  AlertTriangle
} from 'lucide-react';

const NotFound = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-md w-full"
      >
        {/* 404 Illustration */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-32 h-32 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-white font-bold text-6xl">404</span>
          </div>
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto" />
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 leading-relaxed">
            Sorry, we couldn't find the page you're looking for. 
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1"
            >
              <Link
                to="/"
                className="btn btn-primary btn-lg w-full"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1"
            >
              <button
                onClick={() => window.history.back()}
                className="btn btn-secondary btn-lg w-full"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </button>
            </motion.div>
          </div>

          {/* Search Suggestion */}
          <div className="mt-8 p-4 bg-white rounded-lg shadow-medium border border-gray-100">
            <div className="flex items-center space-x-3">
              <Search className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Looking for something specific?</p>
                <p className="text-xs text-gray-500">Try searching or visit our help center</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Help Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 text-sm text-gray-500"
        >
          <p>Need help? Visit our <Link to="/support" className="text-orange-600 hover:text-orange-700 font-medium">Support Center</Link></p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
