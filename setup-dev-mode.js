#!/usr/bin/env node

/**
 * Development Setup Script
 * Sets up the Resume Refresh Platform for development without requiring external API keys
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Setting up Resume Refresh Platform for development...\n');

// Generate secure random keys
const generateKey = () => crypto.randomBytes(64).toString('hex');

// Default development environment for backend
const backendEnv = `# Development Environment - Auto-generated
# This file provides working defaults for development

# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/resume-refresh-platform

# JWT Configuration (Development keys - CHANGE IN PRODUCTION)
JWT_SECRET=${generateKey()}
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=${generateKey()}
JWT_REFRESH_EXPIRE=7d

# Email Configuration (Mock mode - no real emails sent)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=dev-user
SMTP_PASSWORD=dev-password
FROM_EMAIL=dev@resumerefresh.com
FROM_NAME=Resume Refresh Platform (Dev)
SUPPORT_EMAIL=dev-support@resumerefresh.com

# Brevo API Configuration (Mock mode)
BREVO_SMTP_API_KEY=mock-smtp-key-for-development
BREVO_SENDER_EMAIL=dev@resumerefresh.com
BREVO_SENDER_NAME=Resume Refresh Platform (Dev)

# Google Gemini AI Configuration (Mock mode)
GEMINI_API_KEY=mock-gemini-api-key-for-development
GEMINI_MODEL=gemini-pro
GEMINI_EMBEDDING_MODEL=embedding-001
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7
GEMINI_TIMEOUT=30000

# Redis Configuration (Optional - will use memory fallback)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
UPLOAD_PATH=uploads/

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Security Configuration
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Development Mode Flags
MOCK_AI_SERVICES=true
MOCK_EMAIL_SERVICES=true
SKIP_EMAIL_VERIFICATION=true
ENABLE_DEV_ROUTES=true

# Notification Configuration
NOTIFICATION_QUEUE_NAME=dev-notifications
NOTIFICATION_RETRY_ATTEMPTS=1
NOTIFICATION_RETRY_DELAY=1000
WEEKLY_REMINDER_CRON=0 9 * * 1
JOB_MATCH_THRESHOLD=30
PROFILE_STALE_DAYS=7
REMINDER_FREQUENCY_DAYS=1
`;

// Default development environment for frontend
const frontendEnv = `# Frontend Development Environment - Auto-generated

# API Configuration
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=Resume Refresh Platform
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=AI-Powered Resume Refresh & Job Portal Platform

# Development Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_FILE_UPLOAD=true
VITE_DEV_MODE=true
`;

// Create backend .env if it doesn't exist
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(backendEnvPath)) {
  fs.writeFileSync(backendEnvPath, backendEnv);
  console.log('✅ Created backend/.env with development defaults');
} else {
  console.log('ℹ️  backend/.env already exists, skipping...');
}

// Create frontend .env if it doesn't exist
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
if (!fs.existsSync(frontendEnvPath)) {
  fs.writeFileSync(frontendEnvPath, frontendEnv);
  console.log('✅ Created frontend/.env with development defaults');
} else {
  console.log('ℹ️  frontend/.env already exists, skipping...');
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Create logs directory
const logsDir = path.join(__dirname, 'backend', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
}

console.log('\n🎉 Development environment setup complete!');
console.log('\n📝 What was configured:');
console.log('   • Backend .env with mock API keys and secure JWT secrets');
console.log('   • Frontend .env with API endpoint configuration');
console.log('   • Mock AI services (no external API calls required)');
console.log('   • Mock email services (no email provider required)');
console.log('   • File upload and logging directories');
console.log('\n🚀 To start the development servers:');
console.log('   npm run dev');
console.log('\n🔧 To use real services later:');
console.log('   • Add your Google Gemini API key to backend/.env');
console.log('   • Add your Brevo SMTP API key to backend/.env');
console.log('   • Set MOCK_AI_SERVICES=false and MOCK_EMAIL_SERVICES=false');
console.log('\n📚 Check DEVELOPMENT.md for detailed instructions');
