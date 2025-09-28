# 🔗 Quick API Reference

## 🌐 **Base URLs**
- **API Base**: `http://localhost:5000/api`
- **Health**: `http://localhost:5000/health`

## 🔐 **Authentication** (9 endpoints)
```
POST   /auth/register              # Register user
POST   /auth/login                 # Login user  
POST   /auth/logout                # Logout user
POST   /auth/refresh-token         # Refresh JWT
GET    /auth/me                    # Get current user
POST   /auth/forgot-password       # Request password reset
PUT    /auth/reset-password/:token # Reset password
POST   /auth/send-otp              # Send OTP
POST   /auth/verify-otp            # Verify OTP
```

## 👤 **Users** (8 endpoints)
```
GET    /users/profile              # Get profile
PUT    /users/profile              # Update profile
GET    /users/profile/completion   # Profile completion %
PUT    /users/preferences          # Update preferences
POST   /users/avatar               # Upload avatar
DELETE /users/avatar               # Delete avatar
PUT    /users/deactivate           # Deactivate account
GET    /users/search               # Search users
```

## 💼 **Jobs** (8 endpoints)
```
GET    /jobs                       # List jobs
GET    /jobs/:id                   # Get job by ID
POST   /jobs                       # Create job (recruiter)
PUT    /jobs/:id                   # Update job
DELETE /jobs/:id                   # Delete job
GET    /jobs/my-jobs               # Get recruiter's jobs
POST   /jobs/:id/apply             # Apply to job
GET    /jobs/:id/applications      # Get applications
```

## 📄 **Resumes** (7 endpoints)
```
POST   /resumes/upload             # Upload resume
GET    /resumes                    # Get user resumes
GET    /resumes/:id                # Get resume by ID
PUT    /resumes/:id                # Update resume
DELETE /resumes/:id                # Delete resume
GET    /resumes/:id/download       # Download resume
POST   /resumes/:id/export         # Export resume
```

## 🤖 **AI Services** (7 endpoints)
```
GET    /ai/job-recommendations     # Job recommendations
GET    /ai/candidate-recommendations/:jobId  # Candidate matches
POST   /ai/match/resume-to-job     # Match resume to job
POST   /ai/match/job-to-resume     # Match job to resume
POST   /ai/analyze/resume          # Analyze resume
POST   /ai/suggestions/resume      # Resume suggestions
POST   /ai/embeddings/generate     # Generate embeddings
```

## 🔔 **Notifications** (8 endpoints)
```
GET    /notifications              # Get notifications
GET    /notifications/:id          # Get notification by ID
PUT    /notifications/:id/read     # Mark as read
PUT    /notifications/mark-all-read # Mark all as read
PUT    /notifications/preferences  # Update preferences
POST   /notifications/job-match    # Send job match
POST   /notifications/unsubscribe  # Unsubscribe
GET    /notifications/amp/:token   # AMP interactions
```

## 👨‍💼 **Admin - System** (4 endpoints)
```
GET    /admin/system/stats         # System statistics
GET    /admin/system/health        # System health
GET    /admin/system/activity      # Recent activity
GET    /admin/analytics            # System analytics
```

## 👨‍💼 **Admin - Users** (7 endpoints)
```
GET    /admin/users                # Get all users
GET    /admin/users/:id            # Get user by ID
PUT    /admin/users/:id/activate   # Activate user
PUT    /admin/users/:id/deactivate # Deactivate user
DELETE /admin/users/:id            # Delete user
POST   /admin/users/:id/reset-password # Reset password
POST   /admin/users/bulk           # Bulk operations
```

## 👨‍💼 **Admin - Jobs** (6 endpoints)
```
GET    /admin/jobs                 # Get all jobs
PUT    /admin/jobs/:id/approve     # Approve job
PUT    /admin/jobs/:id/reject      # Reject job
PUT    /admin/jobs/:id/flag        # Flag job
DELETE /admin/jobs/:id             # Delete job
POST   /admin/jobs/bulk            # Bulk operations
```

## 👨‍💼 **Admin - Notifications** (8 endpoints)
```
GET    /admin/notifications        # Notification logs
GET    /admin/notifications/stats  # Notification stats
GET    /admin/notifications/queue/status # Queue status
POST   /admin/notifications/:id/retry # Retry notification
POST   /admin/notifications/retry-all-failed # Retry all failed
DELETE /admin/notifications/:id    # Delete notification
POST   /admin/notifications/bulk   # Bulk operations
POST   /admin/notifications/test   # Test notification
```

## 👨‍💼 **Admin - Configuration** (8 endpoints)
```
GET    /admin/settings             # Get settings
PUT    /admin/settings             # Update settings
GET    /admin/feature-flags        # Get feature flags
PUT    /admin/feature-flags/:flag  # Toggle feature
GET    /admin/cron-jobs            # Get CRON jobs
PUT    /admin/cron-jobs/:job       # Toggle CRON job
POST   /admin/cron-jobs/:job/run   # Run CRON job
GET    /admin/maintenance/logs     # Get logs
```

## 👨‍💼 **Admin - Maintenance** (4 endpoints)
```
POST   /admin/maintenance/clear-cache      # Clear cache
POST   /admin/maintenance/optimize-database # Optimize DB
GET    /admin/maintenance/logs/download    # Download logs
DELETE /admin/maintenance/logs             # Clear logs
```

---

## 🎯 **Quick Test Commands**

### **Health Check**
```bash
curl http://localhost:5000/health
```

### **Register & Login**
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"TestPass123","role":"candidate"}'

# Login  
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

### **Test with Token**
```bash
# Get profile (replace YOUR_TOKEN_HERE with actual token)
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get job recommendations
curl -X GET http://localhost:5000/api/ai/job-recommendations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 **Status Legend**
- ✅ **Working**: Fully functional with mock/real data
- ✅ **Ready**: Implemented, may need testing
- ⚠️ **Needs Implementation**: Endpoint exists but needs full CRUD logic

**Total: 89 endpoints across 10 categories serving all platform functionality!** 🚀





