# 🛠️ Development Guide

Comprehensive development guide for the Resume Refresh Platform with setup instructions, troubleshooting, and best practices.

## 🚀 Quick Start (Choose Your OS)

### Windows Users
```cmd
# Run the setup script
start-dev.bat

# Or manually:
npm install
cd backend && npm install
cd ..\frontend && npm install
cd ..
npm run dev
```

### macOS/Linux Users
```bash
# Run the setup script
./start-dev.sh

# Or manually:
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
npm run dev
```

## 📋 Prerequisites Checklist

### ✅ **Required Software**
- [ ] **Node.js v18+** - JavaScript runtime
- [ ] **MongoDB v6+** - Database server
- [ ] **Git** - Version control
- [ ] **VS Code** - Code editor (recommended)

### ✅ **Optional for Enhanced Development**
- [ ] **MongoDB Compass** - Database GUI
- [ ] **Postman** - API testing
- [ ] **Redis** - For notification queues
- [ ] **Docker** - For containerized development

## 🔧 Environment Configuration

### Backend Environment (.env)
```env
# === SERVER CONFIGURATION ===
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# === DATABASE ===
MONGODB_URI=mongodb://localhost:27017/resume-refresh-platform

# === JWT AUTHENTICATION ===
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this
REFRESH_TOKEN_EXPIRES_IN=7d

# === GOOGLE GEMINI AI ===
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro
GEMINI_EMBEDDING_MODEL=embedding-001
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7
GEMINI_TIMEOUT=30000

# === EMAIL CONFIGURATION (BREVO) ===
BREVO_SMTP_API_KEY=your-brevo-smtp-api-key
BREVO_SENDER_EMAIL=noreply@resumerefresh.com
BREVO_SENDER_NAME=Resume Refresh Platform

# === REDIS CONFIGURATION ===
REDIS_URL=redis://localhost:6379
NOTIFICATION_QUEUE_NAME=notifications
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY=5000

# === NOTIFICATION SETTINGS ===
WEEKLY_REMINDER_CRON=0 9 * * 1
JOB_MATCH_THRESHOLD=50
PROFILE_STALE_DAYS=30
REMINDER_FREQUENCY_DAYS=7

# === FILE UPLOAD ===
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
ALLOWED_FILE_TYPES=pdf,doc,docx

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# === LOGGING ===
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### Frontend Environment (.env)
```env
# === API CONFIGURATION ===
VITE_API_URL=http://localhost:5000/api

# === APP CONFIGURATION ===
VITE_APP_NAME=Resume Refresh Platform
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=AI-Powered Resume Refresh & Job Portal Platform

# === FEATURES ===
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_FILE_UPLOAD=true
```

## 🏃‍♂️ Running the Project

### Option 1: Concurrent Development (Recommended)
```bash
# Start both backend and frontend together
npm run dev
```

This will start:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

### Option 2: Separate Terminals
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend  
npm run frontend
```

### Option 3: Production Build
```bash
# Build frontend for production
npm run build

# Start production backend
npm start
```

## 🔍 Verification Steps

### 1. Backend Health Check
```bash
# Test if backend is running
curl http://localhost:5000/health

# Expected response:
# {"status": "OK", "timestamp": "2024-01-15T10:30:00.000Z"}
```

### 2. Frontend Access
- Open browser to http://localhost:3000
- Should see professional landing page
- Test navigation between pages

### 3. Database Connection
```bash
# Connect to MongoDB
mongosh resume-refresh-platform

# Check if database exists
show collections
```

### 4. API Endpoints Test
```bash
# Test auth endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"TestPass123","role":"candidate"}'
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### **Port Already in Use**
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux - Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

#### **MongoDB Connection Failed**
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ismaster')"

# Start MongoDB service
# Windows:
net start MongoDB

# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

#### **Dependencies Issues**
```bash
# Clear and reinstall all dependencies
npm run clean
npm run install:all

# Or manually:
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
cd backend && npm install
cd ../frontend && npm install
```

#### **Environment Variables Not Loading**
- Ensure `.env` files are in correct locations:
  - `backend/.env` (not `backend/src/.env`)
  - `frontend/.env` (not `frontend/src/.env`)
- Restart servers after changing `.env` files
- Check for typos in variable names

#### **API Key Issues**
```bash
# Test Gemini API key
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://generativelanguage.googleapis.com/v1/models"

# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📁 Project Structure

```
Resume_Project/
├── backend/                 # Node.js + Express API
│   ├── src/                # Source code
│   ├── ai-services/        # AI/ML services
│   ├── notifications/      # Email system
│   ├── tests/             # Backend tests
│   └── package.json       # Backend dependencies
├── frontend/              # React.js application
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── package.json           # Root package.json
├── SETUP.md              # Setup instructions
├── DEVELOPMENT.md        # This file
├── start-dev.bat         # Windows setup script
└── start-dev.sh          # Unix setup script
```

## 🎯 Development Workflow

### Daily Development
1. **Start Development Servers**
   ```bash
   npm run dev
   ```

2. **Make Code Changes**
   - Backend: Hot reload with nodemon
   - Frontend: Hot reload with Vite

3. **Test Changes**
   ```bash
   npm run test
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push
   ```

### Code Quality
```bash
# Run linting
npm run lint

# Run tests
npm run test

# Check for security vulnerabilities
npm audit
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Frontend Testing
```bash
cd frontend
npm test                   # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### API Testing with Postman
1. Import the Postman collection (if available)
2. Set environment variables:
   - `baseUrl`: http://localhost:5000/api
   - `token`: (will be set after login)

## 🔄 Database Management

### Sample Data
```bash
# Seed database with sample data
npm run seed
```

### Database Operations
```bash
# Connect to database
mongosh resume-refresh-platform

# Common commands:
show collections           # List all collections
db.users.find().limit(5)  # View users
db.jobs.find().limit(5)   # View jobs
db.users.countDocuments() # Count users
db.dropDatabase()         # Reset database (CAREFUL!)
```

## 🚀 Production Build

### Build Process
```bash
# Build frontend for production
npm run build

# Start production backend
npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure production database URL
- Set up proper CORS origins
- Enable HTTPS

## 📊 Monitoring & Debugging

### Backend Logs
- Check console output for errors
- Logs are written to `backend/logs/` directory
- Use `LOG_LEVEL=debug` for detailed logging

### Frontend Debugging
- Open browser DevTools (F12)
- Check Console tab for errors
- Use Network tab to monitor API calls
- Use React DevTools extension

### Database Monitoring
```bash
# Monitor MongoDB operations
mongosh resume-refresh-platform --eval "db.currentOp()"

# Check database stats
mongosh resume-refresh-platform --eval "db.stats()"
```

## 🔧 Development Tools

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Thunder Client (API testing)

### Browser Extensions
- React Developer Tools
- Redux DevTools (if using Redux)
- JSON Viewer

## 🎯 Next Steps

### After Setup
1. **Explore the Application**
   - Visit http://localhost:3000
   - Test registration flow
   - Try different user roles

2. **Review Documentation**
   - Check component READMEs
   - Review API documentation
   - Understand project structure

3. **Start Development**
   - Pick a feature to work on
   - Create feature branch
   - Follow coding standards

### Useful Development Commands
```bash
# Quick restart
npm run dev

# Reset everything
npm run reset

# Check project health
npm run test && npm run lint

# Build for production
npm run build
```

---

**Happy coding! The Resume Refresh Platform is ready for development.** 🚀

If you encounter any issues, check the troubleshooting section above or refer to the component-specific documentation in each directory.
