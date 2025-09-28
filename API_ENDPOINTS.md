# 🔗 Resume Refresh Platform - API Endpoints

Complete list of all API endpoints for testing the Resume Refresh Platform backend services.

## 🌐 Base Configuration

**Base URL**: `http://localhost:5000/api`  
**Health Check**: `http://localhost:5000/health`

## 📋 Quick Test Commands

### Health Check
```bash
curl http://localhost:5000/health
```

## 🔐 Authentication Endpoints

### 1. User Registration
**POST** `/auth/register`

```bash
# Candidate Registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john.candidate@example.com",
    "password": "SecurePass123",
    "role": "candidate",
    "phone": "+1-555-123-4567",
    "skills": ["JavaScript", "React", "Node.js"],
    "experienceLevel": "mid",
    "city": "San Francisco",
    "state": "CA",
    "country": "United States"
  }'

# Recruiter Registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.recruiter@example.com", 
    "password": "SecurePass123",
    "role": "recruiter",
    "companyName": "Tech Corp Inc",
    "position": "Senior Talent Acquisition Manager",
    "contactNumber": "+1-555-987-6543",
    "companyWebsite": "https://www.techcorp.com"
  }'
```

### 2. User Login
**POST** `/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.candidate@example.com",
    "password": "SecurePass123",
    "rememberMe": true
  }'
```

### 3. Forgot Password
**POST** `/auth/forgot-password`

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.candidate@example.com"
  }'
```

### 4. Reset Password
**PUT** `/auth/reset-password/:token`

```bash
curl -X PUT http://localhost:5000/api/auth/reset-password/RESET_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePass123"
  }'
```

### 5. Refresh Token
**POST** `/auth/refresh-token`

```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 6. Logout
**POST** `/auth/logout`

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 7. Get Current User
**GET** `/auth/me`

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. OTP Verification
**POST** `/auth/send-otp`

```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.candidate@example.com"
  }'
```

**POST** `/auth/verify-otp`

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.candidate@example.com",
    "otp": "123456"
  }'
```

## 👤 User Management Endpoints

### 1. Get User Profile
**GET** `/users/profile`

```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Update User Profile
**PUT** `/users/profile`

```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1-555-123-4567",
    "location": {
      "city": "San Francisco",
      "state": "CA",
      "country": "United States"
    },
    "skills": ["JavaScript", "React", "Node.js", "MongoDB"]
  }'
```

### 3. Upload Avatar
**POST** `/users/avatar`

```bash
curl -X POST http://localhost:5000/api/users/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@/path/to/your/image.jpg"
```

### 4. Get Profile Completion
**GET** `/users/profile/completion`

```bash
curl -X GET http://localhost:5000/api/users/profile/completion \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Update Preferences
**PUT** `/users/preferences`

```bash
curl -X PUT http://localhost:5000/api/users/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobTypes": ["full-time", "remote"],
    "expectedSalary": {
      "min": 80000,
      "max": 120000,
      "currency": "USD"
    },
    "notifications": {
      "jobMatches": true,
      "resumeReminders": true
    }
  }'
```

## 💼 Job Management Endpoints

### 1. Get Jobs (Public)
**GET** `/jobs`

```bash
curl -X GET "http://localhost:5000/api/jobs?limit=10&page=1&location=San Francisco&skills=JavaScript,React"
```

### 2. Get Job by ID
**GET** `/jobs/:id`

```bash
curl -X GET http://localhost:5000/api/jobs/JOB_ID_HERE
```

### 3. Create Job (Recruiter Only)
**POST** `/jobs`

```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Software Engineer",
    "description": "We are looking for a talented software engineer...",
    "company": {
      "name": "Tech Corp Inc",
      "website": "https://techcorp.com"
    },
    "location": {
      "city": "San Francisco",
      "state": "CA",
      "country": "United States",
      "workMode": "hybrid",
      "isRemote": false
    },
    "salary": {
      "min": 120000,
      "max": 180000,
      "currency": "USD",
      "period": "yearly"
    },
    "skills": ["JavaScript", "React", "Node.js", "AWS"],
    "requirements": [
      "Bachelor degree in Computer Science",
      "5+ years of experience",
      "Strong communication skills"
    ],
    "responsibilities": [
      "Develop and maintain web applications",
      "Collaborate with cross-functional teams",
      "Code reviews and mentoring"
    ],
    "employmentType": "full-time",
    "experienceLevel": "senior",
    "benefits": ["Health insurance", "401k", "Remote work"]
  }'
```

### 4. Update Job (Recruiter Only)
**PUT** `/jobs/:id`

```bash
curl -X PUT http://localhost:5000/api/jobs/JOB_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Job Title",
    "status": "active"
  }'
```

### 5. Delete Job (Recruiter Only)
**DELETE** `/jobs/:id`

```bash
curl -X DELETE http://localhost:5000/api/jobs/JOB_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Get My Jobs (Recruiter Only)
**GET** `/jobs/my-jobs`

```bash
curl -X GET http://localhost:5000/api/jobs/my-jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Apply to Job (Candidate Only)
**POST** `/jobs/:id/apply`

```bash
curl -X POST http://localhost:5000/api/jobs/JOB_ID_HERE/apply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coverLetter": "I am very interested in this position..."
  }'
```

## 📄 Resume Management Endpoints

### 1. Upload Resume
**POST** `/resumes/upload`

```bash
curl -X POST http://localhost:5000/api/resumes/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/path/to/your/resume.pdf" \
  -F "metadata={\"title\": \"My Resume\", \"description\": \"Updated resume\"}"
```

### 2. Get My Resumes
**GET** `/resumes`

```bash
curl -X GET http://localhost:5000/api/resumes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Resume by ID
**GET** `/resumes/:id`

```bash
curl -X GET http://localhost:5000/api/resumes/RESUME_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Update Resume
**PUT** `/resumes/:id`

```bash
curl -X PUT http://localhost:5000/api/resumes/RESUME_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Resume Title",
    "isDefault": true
  }'
```

### 5. Delete Resume
**DELETE** `/resumes/:id`

```bash
curl -X DELETE http://localhost:5000/api/resumes/RESUME_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Download Resume
**GET** `/resumes/:id/download`

```bash
curl -X GET http://localhost:5000/api/resumes/RESUME_ID_HERE/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o "downloaded_resume.pdf"
```

### 7. Export Resume (Different Formats)
**POST** `/resumes/:id/export`

```bash
curl -X POST http://localhost:5000/api/resumes/RESUME_ID_HERE/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "pdf",
    "template": "modern"
  }'
```

## 🤖 AI Services Endpoints

### 1. Get Job Recommendations (Candidate)
**GET** `/ai/job-recommendations`

```bash
curl -X GET "http://localhost:5000/api/ai/job-recommendations?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get Candidate Recommendations (Recruiter)
**GET** `/ai/candidate-recommendations/:jobId`

```bash
curl -X GET http://localhost:5000/api/ai/candidate-recommendations/JOB_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Match Resume to Job
**POST** `/ai/match/resume-to-job`

```bash
curl -X POST http://localhost:5000/api/ai/match/resume-to-job \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "RESUME_ID_HERE",
    "jobId": "JOB_ID_HERE"
  }'
```

### 4. Analyze Resume
**POST** `/ai/analyze/resume`

```bash
curl -X POST http://localhost:5000/api/ai/analyze/resume \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "RESUME_ID_HERE"
  }'
```

### 5. Get Resume Suggestions
**POST** `/ai/suggestions/resume`

```bash
curl -X POST http://localhost:5000/api/ai/suggestions/resume \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "RESUME_ID_HERE",
    "targetJobId": "JOB_ID_HERE"
  }'
```

### 6. Generate Job Embedding
**POST** `/ai/embeddings/job`

```bash
curl -X POST http://localhost:5000/api/ai/embeddings/job \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "JOB_ID_HERE"
  }'
```

### 7. Generate Resume Embedding
**POST** `/ai/embeddings/resume`

```bash
curl -X POST http://localhost:5000/api/ai/embeddings/resume \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "RESUME_ID_HERE"
  }'
```

## 🔔 Notification Endpoints

### 1. Get User Notifications
**GET** `/notifications`

```bash
curl -X GET "http://localhost:5000/api/notifications?limit=20&unreadOnly=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Mark Notification as Read
**PUT** `/notifications/:id/read`

```bash
curl -X PUT http://localhost:5000/api/notifications/NOTIFICATION_ID_HERE/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Mark All as Read
**PUT** `/notifications/mark-all-read`

```bash
curl -X PUT http://localhost:5000/api/notifications/mark-all-read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Update Notification Preferences
**PUT** `/notifications/preferences`

```bash
curl -X PUT http://localhost:5000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobMatches": true,
    "resumeReminders": true,
    "applicationUpdates": true,
    "frequency": "daily"
  }'
```

### 5. Send Job Match Notification (Recruiter)
**POST** `/notifications/job-match`

```bash
curl -X POST http://localhost:5000/api/notifications/job-match \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "CANDIDATE_ID_HERE",
    "jobId": "JOB_ID_HERE",
    "matchScore": 85
  }'
```

### 6. Unsubscribe from Notifications
**POST** `/notifications/unsubscribe`

```bash
curl -X POST http://localhost:5000/api/notifications/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "token": "UNSUBSCRIBE_TOKEN_HERE"
  }'
```

## 👨‍💼 Admin Endpoints

### 1. Get System Stats
**GET** `/admin/system/stats`

```bash
curl -X GET http://localhost:5000/api/admin/system/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 2. Get System Health
**GET** `/admin/system/health`

```bash
curl -X GET http://localhost:5000/api/admin/system/health \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 3. Get All Users
**GET** `/admin/users`

```bash
curl -X GET "http://localhost:5000/api/admin/users?role=candidate&status=active&limit=50" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 4. Activate/Deactivate User
**PUT** `/admin/users/:id/activate`
**PUT** `/admin/users/:id/deactivate`

```bash
# Activate user
curl -X PUT http://localhost:5000/api/admin/users/USER_ID_HERE/activate \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Deactivate user
curl -X PUT http://localhost:5000/api/admin/users/USER_ID_HERE/deactivate \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 5. Bulk User Actions
**POST** `/admin/users/bulk`

```bash
curl -X POST http://localhost:5000/api/admin/users/bulk \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "activate",
    "userIds": ["USER_ID_1", "USER_ID_2", "USER_ID_3"]
  }'
```

### 6. Get All Jobs (Admin)
**GET** `/admin/jobs`

```bash
curl -X GET "http://localhost:5000/api/admin/jobs?status=active&approval=pending" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 7. Approve/Reject Job
**PUT** `/admin/jobs/:id/approve`
**PUT** `/admin/jobs/:id/reject`

```bash
# Approve job
curl -X PUT http://localhost:5000/api/admin/jobs/JOB_ID_HERE/approve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Reject job
curl -X PUT http://localhost:5000/api/admin/jobs/JOB_ID_HERE/reject \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Job description does not meet platform standards"
  }'
```

### 8. Get Notification Logs
**GET** `/admin/notifications`

```bash
curl -X GET "http://localhost:5000/api/admin/notifications?type=job_match&status=failed" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 9. Retry Failed Notifications
**POST** `/admin/notifications/retry-all-failed`

```bash
curl -X POST http://localhost:5000/api/admin/notifications/retry-all-failed \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 10. Feature Flags
**GET** `/admin/feature-flags`
**PUT** `/admin/feature-flags/:flagName`

```bash
# Get feature flags
curl -X GET http://localhost:5000/api/admin/feature-flags \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Toggle feature flag
curl -X PUT http://localhost:5000/api/admin/feature-flags/aiMatching \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true
  }'
```

### 11. CRON Jobs Management
**GET** `/admin/cron-jobs`
**PUT** `/admin/cron-jobs/:jobName`
**POST** `/admin/cron-jobs/:jobName/run`

```bash
# Get CRON jobs status
curl -X GET http://localhost:5000/api/admin/cron-jobs \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Toggle CRON job
curl -X PUT http://localhost:5000/api/admin/cron-jobs/weeklyResumeRefresh \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'

# Run CRON job manually
curl -X POST http://localhost:5000/api/admin/cron-jobs/weeklyResumeRefresh/run \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## 📊 Analytics Endpoints

### 1. Get Dashboard Analytics (Candidate)
**GET** `/analytics/candidate-dashboard`

```bash
curl -X GET http://localhost:5000/api/analytics/candidate-dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get Recruiter Analytics
**GET** `/analytics/recruiter-dashboard`

```bash
curl -X GET http://localhost:5000/api/analytics/recruiter-dashboard \
  -H "Authorization: Bearer RECRUITER_JWT_TOKEN"
```

### 3. Get System Analytics (Admin)
**GET** `/admin/analytics`

```bash
curl -X GET "http://localhost:5000/api/admin/analytics?timeRange=30d" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## 🧪 Testing Scenarios

### Complete User Flow Test
```bash
# 1. Register a candidate
CANDIDATE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Candidate",
    "email": "test.candidate@example.com",
    "password": "TestPass123",
    "role": "candidate"
  }')

# 2. Login as candidate
CANDIDATE_LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.candidate@example.com",
    "password": "TestPass123"
  }')

# Extract token (you'll need to parse JSON)
CANDIDATE_TOKEN="YOUR_TOKEN_HERE"

# 3. Get profile
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $CANDIDATE_TOKEN"

# 4. Get job recommendations
curl -X GET http://localhost:5000/api/ai/job-recommendations \
  -H "Authorization: Bearer $CANDIDATE_TOKEN"
```

### Recruiter Flow Test
```bash
# 1. Register a recruiter
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Recruiter",
    "email": "test.recruiter@example.com",
    "password": "TestPass123",
    "role": "recruiter",
    "companyName": "Test Company",
    "position": "HR Manager",
    "contactNumber": "+1-555-999-0000"
  }'

# 2. Login and get token
RECRUITER_TOKEN="YOUR_RECRUITER_TOKEN_HERE"

# 3. Post a job
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer $RECRUITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job Position",
    "description": "This is a test job posting",
    "location": {"city": "Test City", "state": "TC"},
    "skills": ["Testing", "API"],
    "employmentType": "full-time"
  }'

# 4. Get candidate recommendations for the job
curl -X GET http://localhost:5000/api/ai/candidate-recommendations/JOB_ID_HERE \
  -H "Authorization: Bearer $RECRUITER_TOKEN"
```

## 📝 Postman Collection

### Import into Postman
Create a new collection and import these requests:

1. **Set Environment Variables**:
   - `baseUrl`: `http://localhost:5000/api`
   - `token`: `{{token}}` (will be set after login)

2. **Pre-request Script for Authentication**:
```javascript
// For endpoints requiring auth, add this pre-request script:
if (!pm.environment.get("token")) {
    console.log("No token found, please login first");
}
```

3. **Test Script for Login**:
```javascript
// Add this to login request test script:
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
    pm.environment.set("refreshToken", response.refreshToken);
}
```

## 🔧 Development Testing

### Quick API Health Check
```bash
# Test all critical endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/auth/health
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"test":"data"}'
```

### Load Testing (Optional)
```bash
# Install Apache Bench (ab) for load testing
# Test concurrent users
ab -n 100 -c 10 http://localhost:5000/health
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_123456"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* error details */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

## 🎯 Testing Priorities

### Critical Endpoints (Test First)
1. ✅ Health check
2. ✅ User registration
3. ✅ User login
4. ✅ Get profile
5. ✅ Job listing

### Secondary Endpoints
1. Job creation (recruiter)
2. Resume upload
3. AI recommendations
4. Notifications

### Admin Endpoints (Test Last)
1. System stats
2. User management
3. Job moderation
4. System settings

---

**Use these endpoints to thoroughly test the Resume Refresh Platform API!** 🚀

Copy and paste the curl commands into your terminal, or import them into Postman for a complete testing suite.
