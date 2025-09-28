/**
 * Simple Server for Development
 * Minimal server setup that works without external dependencies
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple auth endpoints for testing
app.post('/api/auth/register', (req, res) => {
  console.log('Registration attempt:', req.body.email);
  res.json({
    success: true,
    message: 'Registration successful! (Mock response)',
    user: {
      id: 'mock-user-id',
      email: req.body.email,
      role: req.body.role || 'candidate',
      firstName: req.body.firstName,
      lastName: req.body.lastName
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body.email);
  
  // Mock JWT token
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';
  
  res.json({
    success: true,
    message: 'Login successful! (Mock response)',
    token: mockToken,
    refreshToken: 'mock-refresh-token',
    user: {
      id: 'mock-user-id',
      email: req.body.email,
      role: req.body.role || 'candidate',
      firstName: 'Demo',
      lastName: 'User'
    }
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  console.log('Password reset request:', req.body.email);
  res.json({
    success: true,
    message: 'Password reset email sent! (Mock response)'
  });
});

// Simple user profile endpoint
app.get('/api/users/profile', (req, res) => {
  res.json({
    success: true,
    profile: {
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      role: 'candidate',
      completionPercentage: 75,
      location: { city: 'San Francisco', state: 'CA' },
      skills: ['JavaScript', 'React', 'Node.js']
    }
  });
});

// Mock jobs endpoint
app.get('/api/jobs', (req, res) => {
  const mockJobs = [
    {
      _id: 'job1',
      title: 'Senior Software Engineer',
      company: { name: 'Tech Corp Inc' },
      location: { city: 'San Francisco', state: 'CA' },
      status: 'active',
      applicationCount: 25,
      createdAt: new Date()
    },
    {
      _id: 'job2', 
      title: 'Product Manager',
      company: { name: 'Innovation Labs' },
      location: { city: 'New York', state: 'NY' },
      status: 'active',
      applicationCount: 18,
      createdAt: new Date()
    }
  ];
  
  res.json({
    success: true,
    data: mockJobs,
    total: mockJobs.length
  });
});

// Mock AI recommendations
app.get('/api/ai/job-recommendations', (req, res) => {
  const mockRecommendations = [
    {
      job: {
        _id: 'job1',
        title: 'Senior Software Engineer',
        company: { name: 'Tech Corp Inc' },
        location: { city: 'San Francisco', state: 'CA' }
      },
      matchPercentage: 92,
      matchedSkills: ['JavaScript', 'React', 'Node.js'],
      reasons: ['Strong technical skills match', 'Experience level aligns well']
    },
    {
      job: {
        _id: 'job2',
        title: 'Full Stack Developer', 
        company: { name: 'StartupXYZ' },
        location: { city: 'Austin', state: 'TX' }
      },
      matchPercentage: 87,
      matchedSkills: ['JavaScript', 'React'],
      reasons: ['Good technical fit', 'Remote work available']
    }
  ];
  
  res.json({
    success: true,
    data: mockRecommendations
  });
});

// Mock notifications endpoint
app.get('/api/notifications', (req, res) => {
  const mockNotifications = [
    {
      _id: 'notif1',
      type: 'job_match',
      subject: 'New Job Match Found!',
      createdAt: new Date(),
      readAt: null
    },
    {
      _id: 'notif2',
      type: 'resume_refresh',
      subject: 'Time to refresh your resume',
      createdAt: new Date(Date.now() - 86400000),
      readAt: new Date()
    }
  ];
  
  res.json({
    success: true,
    data: mockNotifications
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error (Mock mode)'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found (Mock mode)'
  });
});

// Database connection (optional)
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected successfully');
    } else {
      console.log('⚠️ MongoDB URI not configured - running without database');
    }
  } catch (error) {
    console.log('⚠️ MongoDB connection failed - running without database:', error.message);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('🚀 Resume Refresh Backend (Simple Mode)');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log('📧 Email service: Mock mode (logs to console)');
      console.log('🤖 AI service: Mock mode (returns sample data)');
      console.log('');
      console.log('🎯 Frontend should be available at: http://localhost:3000');
      console.log('');
      console.log('Ready for development! 🎉');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
