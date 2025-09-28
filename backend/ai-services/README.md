# AI Services Layer

The AI Services Layer provides comprehensive artificial intelligence capabilities for the Resume Refresh Platform, including semantic matching, resume analysis, and intelligent recommendations.

## 🚀 Features

### Core AI Services

1. **GeminiService** - Google Gemini API integration
   - Text embedding generation
   - Resume improvement suggestions
   - ATS compatibility analysis
   - Job recommendation generation
   - Content optimization

2. **MatchingService** - Semantic job-resume matching
   - Cosine similarity calculations
   - Multi-factor matching algorithm
   - Skills compatibility scoring
   - Experience level matching
   - Keyword relevance analysis

3. **ResumeAIService** - Comprehensive resume analysis
   - Content quality assessment
   - Structure optimization
   - Keyword analysis
   - Skills extraction and categorization
   - Personalized improvement recommendations

## 🛠️ Setup & Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Google Gemini AI Configuration
GEMINI_API_KEY=your-google-gemini-api-key-here
GEMINI_MODEL=gemini-pro
GEMINI_EMBEDDING_MODEL=embedding-001
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7
GEMINI_TIMEOUT=30000

# AI Service Configuration
MIN_MATCH_SCORE=50
MAX_RECOMMENDATIONS=10
```

### Dependencies

The AI services require these npm packages:

```bash
npm install @google/generative-ai cosine-similarity ml-distance
```

### Initialization

The AI services are automatically initialized when the server starts:

```javascript
const { initializeAIServices } = require('./ai-services');

initializeAIServices().then(result => {
  if (result.status === 'success') {
    console.log('AI services ready');
  }
});
```

## 📚 API Endpoints

### Health Check
```http
GET /api/ai/health
```
Check the status of all AI services.

### Embedding Generation
```http
POST /api/ai/embedding
Content-Type: application/json

{
  "text": "Resume or job content to generate embedding for"
}
```

### Resume-Job Matching
```http
POST /api/ai/match/resume-to-job
Content-Type: application/json

{
  "resumeId": "resume_id",
  "jobId": "job_id"
}
```

### Job Recommendations
```http
POST /api/ai/match/job-recommendations
Content-Type: application/json

{
  "resumeId": "resume_id",
  "limit": 10,
  "filters": {
    "location": "New York",
    "employmentType": ["full-time"],
    "workMode": ["remote", "hybrid"],
    "salaryMin": 50000
  }
}
```

### Candidate Recommendations
```http
POST /api/ai/match/candidate-recommendations
Content-Type: application/json

{
  "jobId": "job_id",
  "limit": 10,
  "filters": {
    "minAtsScore": 70,
    "skills": ["JavaScript", "React"],
    "experience": 3
  }
}
```

### Resume Analysis
```http
POST /api/ai/analyze/resume
Content-Type: application/json

{
  "resumeId": "resume_id"
}
```

### Resume Suggestions
```http
POST /api/ai/suggestions/resume
Content-Type: application/json

{
  "resumeId": "resume_id"
}
```

### Resume Optimization for Job
```http
POST /api/ai/optimize/resume-for-job
Content-Type: application/json

{
  "resumeId": "resume_id",
  "jobId": "job_id"
}
```

### Skills Extraction
```http
POST /api/ai/extract/skills
Content-Type: application/json

{
  "resumeId": "resume_id"
}
```
Or with direct content:
```json
{
  "content": "Resume text content to analyze"
}
```

### Job Description Optimization
```http
POST /api/ai/optimize/job-description
Content-Type: application/json

{
  "jobId": "job_id"
}
```
Or with direct content:
```json
{
  "description": "Job description text to optimize"
}
```

### Bulk Embedding Generation
```http
POST /api/ai/embeddings/resumes/bulk
POST /api/ai/embeddings/jobs/bulk
Content-Type: application/json

{
  "limit": 50
}
```

## 🧠 How It Works

### Semantic Matching Algorithm

The matching algorithm uses a weighted scoring system:

```javascript
const matchWeights = {
  semantic: 0.4,      // Semantic similarity via embeddings
  skills: 0.25,       // Direct skills matching
  experience: 0.2,    // Experience level matching
  keywords: 0.15      // Keyword matching
};
```

### Match Score Calculation

1. **Semantic Similarity (40%)**
   - Uses cosine similarity between embeddings
   - Captures contextual understanding
   - Identifies related concepts and synonyms

2. **Skills Matching (25%)**
   - Exact skill matches
   - Partial/fuzzy skill matches
   - Weighted by skill importance

3. **Experience Matching (20%)**
   - Years of experience comparison
   - Experience level alignment
   - Career progression analysis

4. **Keywords Matching (15%)**
   - Industry-specific terminology
   - Job-relevant keywords
   - ATS optimization keywords

### Resume Analysis Components

1. **Content Analysis**
   - Professional summary quality
   - Achievement quantification
   - Action verb usage
   - Content completeness

2. **ATS Compatibility**
   - File format optimization
   - Parsing quality assessment
   - Keyword density analysis
   - Structure compliance

3. **Skills Assessment**
   - Technical skills extraction
   - Soft skills identification
   - Skill categorization
   - Industry relevance scoring

4. **Improvement Suggestions**
   - Prioritized recommendations
   - Implementation difficulty rating
   - Expected impact assessment
   - Specific action items

## 🔧 Service Architecture

### GeminiService
```javascript
const { geminiService } = require('./ai-services');

// Generate embeddings
const embedding = await geminiService.generateEmbedding(text);

// Get resume suggestions
const suggestions = await geminiService.generateResumeSuggestions(content);

// Analyze ATS compatibility
const analysis = await geminiService.analyzeATSCompatibility(content);
```

### MatchingService
```javascript
const { matchingService } = require('./ai-services');

// Calculate match score
const matchResult = await matchingService.calculateMatchScore(resume, job);

// Find job matches
const jobMatches = await matchingService.findJobMatches(resume, jobs, 10);

// Find candidate matches
const candidateMatches = await matchingService.findCandidateMatches(job, resumes, 10);
```

### ResumeAIService
```javascript
const { resumeAIService } = require('./ai-services');

// Comprehensive resume analysis
const analysis = await resumeAIService.analyzeResume(resume);

// Generate job recommendations
const recommendations = await resumeAIService.generateJobRecommendations(resume, jobs);

// Optimize for specific job
const optimization = await resumeAIService.optimizeForJob(resume, job);
```

## 🚦 Error Handling & Retry Logic

The AI services include comprehensive error handling:

1. **Retry Logic**
   - Automatic retries for transient errors
   - Exponential backoff strategy
   - Rate limit handling

2. **Timeout Management**
   - Configurable request timeouts
   - Graceful timeout handling
   - Fallback responses

3. **Error Categories**
   - Retryable errors (rate limits, network issues)
   - Non-retryable errors (authentication, invalid input)
   - Graceful degradation

## 📊 Performance Considerations

### Caching Strategy
- Analysis results cached for 1 hour
- Embeddings cached indefinitely
- LRU cache for frequently accessed data

### Rate Limiting
- Batch processing for bulk operations
- Delays between API calls
- Queue management for high loads

### Optimization
- Embedding generation in background
- Lazy loading of AI models
- Connection pooling for API calls

## 🧪 Testing

Run the AI services tests:

```bash
npm test tests/ai-services.test.js
```

### Test Coverage
- Unit tests for all core functions
- Integration tests for end-to-end flows
- Mock implementations for external APIs
- Performance benchmarks

### Mock Data
Use the provided test utilities:

```javascript
const { createMockResume, createMockJob } = require('../tests/ai-services.test.js');

const resume = createMockResume({ atsScore: 90 });
const job = createMockJob({ skills: ['JavaScript', 'React'] });
```

## 🔒 Security & Privacy

1. **API Key Management**
   - Environment variable storage
   - No hardcoded credentials
   - Secure key rotation

2. **Data Privacy**
   - Minimal data sent to external APIs
   - Content preprocessing and sanitization
   - User consent for AI processing

3. **Access Control**
   - Role-based endpoint access
   - User ownership verification
   - Admin-only bulk operations

## 📈 Monitoring & Logging

### Health Monitoring
```javascript
const health = await getAIServicesHealth();
console.log(health.services.gemini.status); // 'healthy' or 'unhealthy'
```

### Logging Levels
- **INFO**: Service initialization, successful operations
- **WARN**: Retries, degraded performance
- **ERROR**: Failed operations, API errors
- **DEBUG**: Detailed operation logs

### Metrics Tracking
- API response times
- Success/failure rates
- Cache hit ratios
- Resource utilization

## 🚀 Deployment

### Environment Setup
1. Set up Google Gemini API access
2. Configure environment variables
3. Initialize MongoDB indexes
4. Test API connectivity

### Scaling Considerations
- Horizontal scaling support
- Load balancing for API calls
- Database connection pooling
- Cache distribution

### Production Checklist
- [ ] API keys configured
- [ ] Error monitoring enabled
- [ ] Performance metrics tracked
- [ ] Backup strategies in place
- [ ] Security audit completed

## 🔮 Future Enhancements

1. **Additional AI Models**
   - Support for multiple embedding models
   - Model A/B testing framework
   - Custom model training

2. **Advanced Features**
   - Real-time job alerts
   - Career path recommendations
   - Salary prediction models
   - Interview preparation suggestions

3. **Performance Improvements**
   - Vector database integration
   - Approximate nearest neighbor search
   - Model quantization
   - Edge computing deployment

## 📞 Support

For issues or questions about the AI services:

1. Check the health endpoint: `/api/ai/health`
2. Review logs for error details
3. Verify environment configuration
4. Test with mock data first

## 📝 License

This AI services layer is part of the Resume Refresh Platform and follows the same licensing terms.
