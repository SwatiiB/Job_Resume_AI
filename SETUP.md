# 🚀 Resume Refresh Platform - Setup Guide

Complete setup instructions to get the AI-Powered Resume Refresh & Job Portal Platform running locally.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Optional (for production)
- **Docker** - [Download](https://www.docker.com/)
- **Redis** (for notifications) - [Download](https://redis.io/)

## 🛠️ Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd Resume_Project

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 2. Environment Setup

#### Backend Environment
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit backend/.env with your configuration
```

**Required Backend Environment Variables:**
```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/resume-refresh-platform

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this
REFRESH_TOKEN_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro
GEMINI_EMBEDDING_MODEL=embedding-001

# Email Configuration (Brevo)
BREVO_SMTP_API_KEY=your-brevo-smtp-api-key
BREVO_SENDER_EMAIL=noreply@resumerefresh.com
BREVO_SENDER_NAME=Resume Refresh Platform

# Redis (for notifications)
REDIS_URL=redis://localhost:6379
```

#### Frontend Environment
```bash
# Copy environment template
cp frontend/env.example frontend/.env

# Edit frontend/.env
```

**Required Frontend Environment Variables:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Resume Refresh Platform
VITE_APP_VERSION=1.0.0
```

### 3. Database Setup

#### Option A: Local MongoDB
```bash
# Start MongoDB service
# On Windows:
net start MongoDB

# On macOS (with Homebrew):
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in backend/.env

### 4. Start the Application

#### Option A: Development Mode (Recommended)
```bash
# Start both backend and frontend concurrently
npm run dev
```

#### Option B: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs (when implemented)

## 🔧 Development Scripts

### Root Level Scripts
```bash
npm run dev          # Start both backend and frontend
npm run backend      # Start backend only
npm run frontend     # Start frontend only
npm run build        # Build for production
npm run test         # Run all tests
npm run lint         # Lint all code
```

### Backend Scripts
```bash
cd backend
npm run dev          # Development with nodemon
npm start           # Production start
npm test            # Run backend tests
npm run seed        # Seed database with sample data
```

### Frontend Scripts
```bash
cd frontend
npm run dev         # Development with Vite
npm run build       # Production build
npm run preview     # Preview production build
npm test           # Run frontend tests
```

## 🎯 First Time Setup Checklist

### ✅ **Environment Setup**
- [ ] Node.js installed (v18+)
- [ ] MongoDB running locally or Atlas connection ready
- [ ] Backend .env file configured
- [ ] Frontend .env file configured
- [ ] Dependencies installed for both backend and frontend

### ✅ **API Keys Setup**
- [ ] Google Gemini API key obtained and configured
- [ ] Brevo SMTP API key for email notifications
- [ ] JWT secrets generated (use strong, random strings)
- [ ] Redis connection configured (optional for development)

### ✅ **Database Setup**
- [ ] MongoDB connection successful
- [ ] Database created (resume-refresh-platform)
- [ ] Sample data seeded (optional)

### ✅ **Application Testing**
- [ ] Backend server starts without errors (http://localhost:5000)
- [ ] Frontend application loads (http://localhost:3000)
- [ ] Database connection successful
- [ ] API endpoints responding
- [ ] Authentication flow working

## 🐛 Common Issues & Solutions

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ismaster')"

# Start MongoDB service
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>

# Or use different ports in .env files
```

### Missing Dependencies
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For both backend and frontend
cd backend && rm -rf node_modules package-lock.json && npm install
cd ../frontend && rm -rf node_modules package-lock.json && npm install
```

### Environment Variables Not Loading
```bash
# Ensure .env files are in correct locations:
# backend/.env (not backend/src/.env)
# frontend/.env (not frontend/src/.env)

# Restart servers after .env changes
```

## 🔑 API Keys Setup

### Google Gemini AI API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to backend/.env as `GEMINI_API_KEY`

### Brevo SMTP (Email)
1. Create account at [Brevo](https://www.brevo.com/)
2. Go to SMTP & API settings
3. Generate API key
4. Add to backend/.env as `BREVO_SMTP_API_KEY`

### JWT Secrets
```bash
# Generate strong JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🧪 Testing the Setup

### Backend Health Check
```bash
curl http://localhost:5000/health
# Should return: {"status": "OK", "timestamp": "..."}
```

### Frontend Access
1. Open http://localhost:3000
2. Should see professional landing page
3. Test navigation to login/register pages

### Database Connection
```bash
# Check MongoDB connection
mongosh resume-refresh-platform
# Should connect without errors
```

## 📚 Development Workflow

### 1. Daily Development
```bash
# Start development environment
npm run dev

# Make changes to code
# Hot reload will update automatically
```

### 2. Testing Changes
```bash
# Run backend tests
cd backend && npm test

# Run frontend tests  
cd frontend && npm test
```

### 3. Building for Production
```bash
# Build frontend
cd frontend && npm run build

# Start production backend
cd backend && npm start
```

## 🔍 Debugging

### Backend Debugging
- Check console output for error messages
- Verify .env variables are loaded
- Test API endpoints with Postman
- Check MongoDB connection and data

### Frontend Debugging
- Open browser DevTools (F12)
- Check Console for JavaScript errors
- Verify API calls in Network tab
- Test responsive design with device simulation

### Database Debugging
```bash
# Connect to MongoDB
mongosh resume-refresh-platform

# Check collections
show collections

# Check users
db.users.find().limit(5)

# Check jobs
db.jobs.find().limit(5)
```

## 🚀 Production Deployment

### Environment Preparation
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure production database
4. Set up proper CORS origins
5. Enable HTTPS

### Build Process
```bash
# Build frontend
cd frontend
npm run build

# Start production backend
cd ../backend
npm start
```

## 📞 Support

### Getting Help
- **Documentation**: Check component READMEs in respective directories
- **Issues**: Create GitHub issue with error details
- **Community**: Join our Discord/Slack for real-time help

### Useful Commands
```bash
# Check versions
node --version
npm --version
mongod --version

# Clear all caches
npm cache clean --force
cd backend && npm cache clean --force
cd ../frontend && npm cache clean --force

# Reset everything
rm -rf node_modules backend/node_modules frontend/node_modules
npm install && cd backend && npm install && cd ../frontend && npm install
```

---

**Follow this guide step by step, and you'll have the Resume Refresh Platform running locally in under 10 minutes!**

Need help with any specific step? Check the troubleshooting section or create an issue with the error details.
