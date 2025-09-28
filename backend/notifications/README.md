# Notification System

A comprehensive, enterprise-grade notification system for the Resume Refresh Platform with Brevo SMTP integration, background job processing, AMP email support, and advanced tracking capabilities.

## 🚀 Features

### Core Notification Services

1. **NotificationService** - Brevo SMTP Integration
   - Multi-channel notifications (Email, SMS, Push - extensible)
   - Handlebars templating with custom helpers
   - AMP email support for interactive emails
   - MJML template compilation
   - Comprehensive tracking and analytics

2. **NotificationQueue** - Background Processing
   - BullMQ-powered job queue with Redis
   - Retry logic with exponential backoff
   - Rate limiting and concurrency control
   - Failed job recovery and monitoring

3. **CronJobManager** - Scheduled Tasks
   - Weekly resume refresh reminders
   - Daily job matching notifications
   - Automated cleanup and maintenance
   - Manual trigger capabilities

## 🛠️ Setup & Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Brevo API Configuration
BREVO_SMTP_API_KEY=your-smtp-key-here
BREVO_SENDER_EMAIL=no-reply@domain.com
BREVO_SENDER_NAME=Resume Refresh Platform

# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Notification Configuration
NOTIFICATION_QUEUE_NAME=notifications
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY=5000
WEEKLY_REMINDER_CRON=0 9 * * 1
JOB_MATCH_THRESHOLD=50
PROFILE_STALE_DAYS=30
REMINDER_FREQUENCY_DAYS=7
```

### Dependencies

```bash
npm install bullmq ioredis handlebars mjml node-cron sib-api-v3-sdk
```

### Initialization

The notification system initializes automatically with the server:

```javascript
const { notificationQueue } = require('./notifications/NotificationQueue');
const { cronJobManager } = require('./jobs/cronJobs');

// Start background services
cronJobManager.start();
notificationQueue.processPendingNotifications();
```

## 📧 Email Templates

### Template Structure

Templates are stored in `/notifications/templates/` and support multiple formats:

- `.hbs` - Handlebars HTML templates
- `.txt` - Plain text templates
- `.mjml` - MJML templates (compiled to HTML)
- `.amp.html` - AMP email templates

### Available Templates

1. **otp-verification.hbs** - Email verification with OTP
2. **job-match.hbs** - Job match notifications with AI scores
3. **resume-refresh-reminder.amp.html** - Interactive AMP email for profile updates
4. **welcome.hbs** - Welcome email for new users
5. **application-status.hbs** - Application status updates

### Template Variables

All templates support personalization variables:

```handlebars
{{firstName}}          <!-- User's first name -->
{{name}}               <!-- User's full name -->
{{email}}              <!-- User's email -->
{{supportEmail}}       <!-- Support email address -->
{{dashboardUrl}}       <!-- Dashboard URL -->
{{unsubscribeUrl}}     <!-- Unsubscribe URL -->

<!-- Job-specific variables -->
{{jobTitle}}           <!-- Job title -->
{{companyName}}        <!-- Company name -->
{{matchScore}}         <!-- AI match percentage -->
{{jobLocation}}        <!-- Job location -->
{{salary}}             <!-- Salary range -->

<!-- Profile variables -->
{{profileCompletion}}  <!-- Profile completion percentage -->
{{daysSinceUpdate}}    <!-- Days since last update -->
{{suggestions}}        <!-- Array of improvement suggestions -->
```

### Custom Handlebars Helpers

```handlebars
{{formatDate date "MMMM DD, YYYY"}}
{{formatCurrency amount "USD"}}
{{capitalize string}}
{{truncate text 100}}
{{ifEquals value1 value2}}
{{join array ", "}}
{{first array 5}}
{{progressBar value 100 200}}
```

## 🔄 Notification Types & Triggers

### Automatic Triggers

1. **User Registration** → Welcome Email + OTP Verification
2. **Job Posting** → Job Match Notifications (≥50% match)
3. **Resume Upload** → Confirmation + Analysis Complete
4. **Application Status Change** → Status Update Email
5. **Weekly Schedule** → Resume Refresh Reminders (if profile stale)

### Manual Triggers

```javascript
const { notificationQueue } = require('./notifications/NotificationQueue');

// Send OTP
await notificationQueue.queueOTPVerification(userId, email, name, otp);

// Send job match
await notificationQueue.queueJobMatchNotification(userId, email, name, jobData, matchScore);

// Send weekly reminder
await notificationQueue.queueWeeklyReminder(userId, email, name, profileData);
```

## 📊 API Endpoints

### User Endpoints

```http
GET /api/notifications
GET /api/notifications/preferences
PUT /api/notifications/preferences
PUT /api/notifications/{id}/read
POST /api/notifications/amp/profile-update
GET /api/notifications/unsubscribe/{token}
```

### Admin Endpoints

```http
GET /api/notifications/admin/all
GET /api/notifications/admin/stats
POST /api/notifications/admin/test
GET /api/notifications/admin/queue/status
POST /api/notifications/admin/retry-all
POST /api/notifications/admin/{id}/retry
POST /api/notifications/admin/queue/pause
POST /api/notifications/admin/queue/resume
GET /api/notifications/admin/cron/status
POST /api/notifications/admin/cron/{jobName}/trigger
```

## 🎯 AMP Email Integration

### Interactive Resume Refresh

The AMP email template allows users to update their profile directly from the email:

```html
<form method="post" action-xhr="{{ampFormEndpoint}}">
  <input type="hidden" name="token" value="{{ampFormToken}}">
  <input type="text" name="currentPosition" placeholder="Current Job Title">
  <input type="text" name="newSkills" placeholder="New Skills">
  <button type="submit">Update Profile</button>
</form>
```

### Security

- **Token-based authentication** for AMP forms
- **HMAC verification** with JWT secret
- **Time-based expiration** (1 hour)
- **Action-specific tokens** (profile_update, etc.)

### AMP Form Handling

```javascript
// Verify token
const verification = notificationService.verifyAMPToken(token);
if (!verification.valid) {
  return res.status(400).json({ error: verification.error });
}

// Process form data
const { recipientId } = verification;
// Update user profile...
```

## 🔄 Background Job Processing

### Job Types

1. **sendEmail** - Send individual emails
2. **weeklyReminder** - Send weekly profile reminders
3. **jobMatchNotification** - Send job match alerts
4. **otpVerification** - Send OTP codes
5. **welcomeEmail** - Send welcome messages
6. **applicationStatusUpdate** - Send status updates
7. **bulkNotification** - Process bulk notifications

### Queue Configuration

```javascript
{
  attempts: 3,                    // Retry failed jobs 3 times
  backoff: 'exponential',         // Exponential backoff strategy
  delay: 5000,                    // Base delay: 5 seconds
  removeOnComplete: 100,          // Keep last 100 completed jobs
  removeOnFail: 50,              // Keep last 50 failed jobs
  concurrency: 5,                // Process 5 jobs concurrently
  limiter: {
    max: 100,                    // Max 100 jobs per minute
    duration: 60000
  }
}
```

### Retry Logic

```javascript
// Exponential backoff: 5s, 10s, 20s
const retryDelay = baseDelay * Math.pow(2, attemptNumber);

// Jobs are retried automatically up to maxRetries
// Failed jobs can be manually retried via admin interface
```

## ⏰ Scheduled Tasks (Cron Jobs)

### Default Schedule

```bash
# Weekly resume refresh reminders (Mondays at 9 AM)
WEEKLY_REMINDER_CRON=0 9 * * 1

# Daily job matching (Every day at 10 AM)
0 10 * * *

# Cleanup old notifications (Daily at 2 AM)
0 2 * * *

# Process failed notifications (Every 30 minutes)
*/30 * * * *

# Update job statuses (Daily at midnight)
0 0 * * *

# Generate analytics (Daily at 1 AM)
0 1 * * *
```

### Manual Triggers

```javascript
// Trigger weekly reminders manually
await cronJobManager.triggerWeeklyReminders();

// Trigger job matching manually
await cronJobManager.triggerJobMatching();

// Add custom cron job
cronJobManager.addCustomJob('customTask', '0 12 * * *', taskFunction);
```

## 📈 Monitoring & Analytics

### Notification Tracking

```javascript
// Track email opens
notification.markAsRead();

// Track clicks
notification.trackClick();

// Handle bounces
notification.handleBounce('Invalid email address');

// Handle unsubscribes
notification.handleUnsubscribe();
```

### Performance Metrics

- **Processing Time** - Time to send notification
- **Queue Time** - Time spent in queue
- **Delivery Rate** - Percentage of successfully delivered notifications
- **Open Rate** - Email open tracking
- **Click Rate** - Link click tracking
- **Bounce Rate** - Failed delivery tracking

### Admin Dashboard Data

```javascript
// Get notification statistics
const stats = await Notification.getStats({
  createdAt: { $gte: startDate, $lte: endDate }
});

// Get queue health
const queueHealth = await notificationQueue.getHealth();

// Get cron job status
const cronStatus = cronJobManager.getStatus();
```

## 🛡️ Security & Compliance

### Data Protection

- **Minimal data collection** - Only necessary information stored
- **Encryption in transit** - HTTPS/TLS for all communications
- **Token-based security** - Secure AMP form handling
- **Unsubscribe compliance** - Easy opt-out mechanisms

### Privacy Controls

- **Granular preferences** - Users control notification types
- **Unsubscribe tokens** - Secure unsubscribe links
- **Data retention** - Automatic cleanup of old notifications
- **Audit trail** - Complete notification history

### Rate Limiting

- **API rate limits** - Prevent abuse of notification endpoints
- **Queue rate limits** - Control notification sending rate
- **User limits** - Prevent spam to individual users
- **IP-based limits** - Protect against automated abuse

## 🧪 Testing

### Run Tests

```bash
# Run notification tests
npm test tests/notifications.test.js

# Run with coverage
npm run test:coverage tests/notifications.test.js
```

### Test Coverage

- ✅ Unit tests for all core functions
- ✅ Integration tests for end-to-end flows
- ✅ Error handling scenarios
- ✅ Performance benchmarks
- ✅ Template rendering tests
- ✅ Queue processing tests

### Mock Utilities

```javascript
const { createMockNotification, createMockJob } = require('../tests/notifications.test.js');

const notification = createMockNotification({ type: 'job_match' });
const job = createMockJob({ title: 'Senior Developer' });
```

## 📱 AMP Email Features

### Interactive Elements

- **Profile Update Forms** - Update skills, preferences, salary
- **Quick Actions** - Mark as interested, save job, update status
- **Real-time Updates** - Dynamic content based on user data
- **Responsive Design** - Mobile-optimized layouts

### AMP Components Used

- `amp-form` - Interactive forms
- `amp-selector` - Multi-choice selections
- `amp-list` - Dynamic content lists
- `amp-carousel` - Job recommendations carousel

### Security Features

- **HMAC token verification** - Secure form submissions
- **Time-based expiration** - Tokens expire after 1 hour
- **Action-specific tokens** - Different tokens for different actions
- **CSRF protection** - Built-in protection against attacks

## 🚀 Production Deployment

### Environment Setup

1. **Configure Brevo Account**
   ```bash
   # Get API key from Brevo dashboard
   BREVO_SMTP_API_KEY=your_api_key_here
   BREVO_SENDER_EMAIL=noreply@yourdomain.com
   ```

2. **Setup Redis**
   ```bash
   # Redis for BullMQ
   REDIS_HOST=your_redis_host
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password
   ```

3. **Configure Domains**
   ```bash
   # Frontend URL for links
   FRONTEND_URL=https://yourdomain.com
   API_URL=https://api.yourdomain.com
   ```

### Scaling Considerations

- **Horizontal scaling** - Multiple worker instances
- **Redis clustering** - Distributed queue processing
- **Load balancing** - Distribute notification load
- **Database sharding** - Scale notification storage

### Monitoring Setup

```javascript
// Health check endpoint
GET /api/notifications/admin/queue/status

// Response
{
  "status": "healthy",
  "active": true,
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 1250,
    "failed": 3
  },
  "worker": {
    "running": true,
    "concurrency": 5
  },
  "redis": {
    "status": "ready"
  }
}
```

## 📋 Notification Types

### System Notifications

| Type | Trigger | Priority | Template |
|------|---------|----------|----------|
| `otp_verification` | User registration | High | otp-verification.hbs |
| `welcome` | Account creation | High | welcome.hbs |
| `password_reset` | Password reset request | High | password-reset.hbs |

### Job-Related Notifications

| Type | Trigger | Priority | Template |
|------|---------|----------|----------|
| `job_match` | New job matches profile | Normal | job-match.hbs |
| `application_status` | Status change | High | application-status.hbs |
| `interview_scheduled` | Interview scheduled | High | interview-scheduled.hbs |

### Profile Notifications

| Type | Trigger | Priority | Template |
|------|---------|----------|----------|
| `resume_refresh_reminder` | Weekly cron (stale profile) | Normal | resume-refresh-reminder.amp.html |
| `profile_completion` | Incomplete profile | Low | profile-completion.hbs |
| `resume_analysis_complete` | AI analysis done | Normal | resume-analysis.hbs |

## 🔧 Advanced Features

### Bulk Notifications

```javascript
const notifications = [
  { recipientId: 'user1', type: 'job_match', ... },
  { recipientId: 'user2', type: 'job_match', ... }
];

const result = await notificationService.bulkSend(notifications);
// Returns: { batchId, total, successful, failed, results }
```

### Conditional Notifications

```javascript
// Check user preferences before sending
const user = await User.findById(recipientId);
if (user.profile.preferences?.notifications?.job_match !== false) {
  await notificationQueue.queueJobMatchNotification(...);
}
```

### A/B Testing Support

```javascript
// Template variants
const templateId = Math.random() > 0.5 ? 'job-match-v1' : 'job-match-v2';

await notificationService.sendNotification({
  templateId,
  metadata: { variant: templateId.split('-').pop() }
});
```

### Personalization Engine

```javascript
// Dynamic content based on user data
const templateData = {
  ...baseData,
  recommendations: await getPersonalizedRecommendations(user),
  recentActivity: await getUserRecentActivity(user),
  trendingSkills: await getTrendingSkills(user.profile.skills)
};
```

## 📊 Analytics & Reporting

### Delivery Metrics

```javascript
// Get notification statistics
const stats = await Notification.getStats({
  createdAt: { $gte: startDate, $lte: endDate }
});

// Returns aggregated data by status
[
  { _id: 'sent', count: 1250, avgProcessingTime: 1500 },
  { _id: 'failed', count: 23, avgProcessingTime: 2100 },
  { _id: 'delivered', count: 1180, avgProcessingTime: 1200 }
]
```

### User Engagement

```javascript
// Track user interactions
notification.markAsRead();     // Email opened
notification.trackClick();     // Link clicked
notification.handleBounce();   // Email bounced
```

### Performance Monitoring

- **Processing time tracking** - Monitor notification speed
- **Queue depth monitoring** - Prevent backlog buildup
- **Error rate tracking** - Monitor failure patterns
- **Resource utilization** - Redis memory, worker CPU

## 🚨 Error Handling & Recovery

### Automatic Recovery

1. **Exponential Backoff** - Automatic retry with increasing delays
2. **Dead Letter Queue** - Failed jobs moved to separate queue
3. **Circuit Breaker** - Pause processing during outages
4. **Health Checks** - Continuous service monitoring

### Manual Recovery

```javascript
// Retry specific notification
await notificationQueue.retryJob(jobId);

// Retry all failed notifications
await notificationQueue.retryAllFailedJobs();

// Clean old jobs
await notificationQueue.cleanJobs();
```

### Error Types

- **Transient Errors** - Network issues, rate limits (auto-retry)
- **Permanent Errors** - Invalid email, blocked sender (no retry)
- **Configuration Errors** - Missing API keys, invalid templates
- **System Errors** - Database issues, Redis unavailable

## 🎛️ Admin Controls

### Queue Management

```javascript
// Pause queue processing
await notificationQueue.pauseQueue();

// Resume queue processing
await notificationQueue.resumeQueue();

// Get queue statistics
const stats = await notificationQueue.getStats();
```

### Notification Management

```javascript
// Get all notifications with filters
const notifications = await Notification.findByRecipient(userId, {
  type: 'job_match',
  status: 'failed',
  limit: 50
});

// Bulk update notification status
await Notification.bulkUpdateStatus(notificationIds, 'cancelled');
```

### System Monitoring

```javascript
// Get comprehensive system health
const health = {
  queue: await notificationQueue.getHealth(),
  service: await notificationService.healthCheck(),
  cron: cronJobManager.getStatus()
};
```

## 🔮 Future Enhancements

### Planned Features

1. **SMS Integration** - Brevo SMS API support
2. **Push Notifications** - FCM integration
3. **In-App Notifications** - Real-time browser notifications
4. **WhatsApp Integration** - Business API support
5. **Slack Integration** - Workspace notifications

### Advanced Analytics

1. **Predictive Analytics** - Optimal send times
2. **Segmentation** - User behavior-based grouping
3. **A/B Testing** - Template performance comparison
4. **Conversion Tracking** - End-to-end funnel analysis

### AI Enhancements

1. **Content Optimization** - AI-optimized subject lines
2. **Send Time Optimization** - ML-based timing
3. **Personalization** - Dynamic content generation
4. **Sentiment Analysis** - Response sentiment tracking

## 📞 Support & Troubleshooting

### Common Issues

1. **Notifications not sending**
   - Check Brevo API key configuration
   - Verify Redis connection
   - Check queue worker status

2. **High failure rate**
   - Monitor Brevo account limits
   - Check email reputation
   - Verify template rendering

3. **Slow processing**
   - Increase worker concurrency
   - Optimize template complexity
   - Scale Redis instance

### Debug Commands

```javascript
// Check service health
const health = await notificationService.healthCheck();

// Get queue statistics
const stats = await notificationQueue.getStats();

// Get failed jobs
const failed = await notificationQueue.getFailedJobs();

// Test notification sending
await notificationService.sendTestNotification('otp_verification', 'test@example.com');
```

### Logs & Monitoring

```bash
# View notification logs
tail -f logs/combined.log | grep "notification"

# Monitor queue processing
tail -f logs/combined.log | grep "Notification job"

# Check cron job execution
tail -f logs/combined.log | grep "cron"
```

## 📄 License

This notification system is part of the Resume Refresh Platform and follows the same licensing terms.

---

## 🎯 Quick Start Example

```javascript
// Send OTP verification
await notificationQueue.queueOTPVerification(
  'user123',
  'user@example.com',
  'John Doe',
  '123456'
);

// Send job match notification
await notificationQueue.queueJobMatchNotification(
  'user123',
  'user@example.com',
  'John Doe',
  jobData,
  85 // 85% match score
);

// Send weekly reminder with AMP form
await notificationQueue.queueWeeklyReminder(
  'user123',
  'user@example.com',
  'John Doe',
  {
    lastProfileUpdate: new Date('2023-01-01'),
    profileCompletion: 75,
    suggestions: ['Add more skills', 'Update experience']
  }
);
```

The notification system is production-ready with enterprise-grade reliability, scalability, and monitoring capabilities!
