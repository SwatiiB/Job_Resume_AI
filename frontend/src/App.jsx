import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth, withAuth } from './contexts/AuthContext';
import CandidateDashboard from './components/candidate/CandidateDashboard';
import RecruiterDashboard from './components/recruiter/RecruiterDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Protected dashboard components
const ProtectedCandidateDashboard = withAuth(CandidateDashboard, ['candidate']);
const ProtectedRecruiterDashboard = withAuth(RecruiterDashboard, ['recruiter']);
const ProtectedAdminDashboard = withAuth(AdminDashboard, ['admin']);

function App() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">RR</span>
          </div>
          <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading Resume Refresh Platform...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={
          isAuthenticated ? (
            user?.role === 'candidate' ? <Navigate to="/dashboard" replace /> :
            user?.role === 'recruiter' ? <Navigate to="/recruiter" replace /> :
            user?.role === 'admin' ? <Navigate to="/admin" replace /> :
            <Navigate to="/auth/login" replace />
          ) : (
            <Home />
          )
        } />
        
        <Route path="/auth/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
        
        <Route path="/auth/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Register />
        } />
        
        <Route path="/auth/forgot-password" element={
          isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />
        } />
        
        {/* Legacy routes for backward compatibility */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />
        
        <Route path="/dashboard" element={<ProtectedCandidateDashboard />} />
        <Route path="/recruiter" element={<ProtectedRecruiterDashboard />} />
        <Route path="/admin" element={<ProtectedAdminDashboard />} />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
