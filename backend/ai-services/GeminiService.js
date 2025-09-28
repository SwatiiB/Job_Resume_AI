const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../src/utils/logger');

/**
 * Google Gemini AI Service
 * Handles all interactions with Google Gemini API including embeddings and text generation
 */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-pro';
    this.embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001';
    this.maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS) || 1000;
    this.temperature = parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7;
    this.timeout = parseInt(process.env.GEMINI_TIMEOUT) || 30000;
    
    if (!this.apiKey) {
      logger.error('GEMINI_API_KEY not found in environment variables');
      throw new Error('Google Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
    
    // Rate limiting
    this.requestQueue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Generate embeddings for text using Gemini API
   */
  async generateEmbedding(text) {
    try {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Text is required for embedding generation');
      }

      // Clean and prepare text
      const cleanText = this.preprocessText(text);
      
      logger.debug(`Generating embedding for text: ${cleanText.substring(0, 100)}...`);

      const result = await this.executeWithRetry(async () => {
        const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
        const response = await model.embedContent(cleanText);
        return response.embedding.values;
      });

      logger.debug(`Generated embedding with ${result.length} dimensions`);
      return result;

    } catch (error) {
      logger.error('Gemini embedding generation error:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddingsBatch(texts) {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error('Array of texts is required for batch embedding generation');
      }

      logger.info(`Generating embeddings for ${texts.length} texts`);

      const embeddings = [];
      const batchSize = 5; // Process in smaller batches to avoid rate limits

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.generateEmbedding(text));
        
        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);

        // Add delay between batches
        if (i + batchSize < texts.length) {
          await this.delay(500);
        }
      }

      logger.info(`Generated ${embeddings.length} embeddings successfully`);
      return embeddings;

    } catch (error) {
      logger.error('Batch embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Generate resume improvement suggestions using Gemini
   */
  async generateResumeSuggestions(resumeContent) {
    try {
      if (!resumeContent) {
        throw new Error('Resume content is required');
      }

      const prompt = this.buildResumeSuggestionsPrompt(resumeContent);
      
      logger.debug('Generating resume suggestions with Gemini');

      const result = await this.executeWithRetry(async () => {
        const response = await this.generativeModel.generateContent(prompt);
        const text = response.response.text();
        return this.parseResumeSuggestions(text);
      });

      logger.debug(`Generated ${result.suggestions.length} resume suggestions`);
      return result;

    } catch (error) {
      logger.error('Resume suggestions generation error:', error);
      throw new Error(`Failed to generate resume suggestions: ${error.message}`);
    }
  }

  /**
   * Generate job recommendations for a candidate
   */
  async generateJobRecommendations(candidateProfile, availableJobs) {
    try {
      if (!candidateProfile || !availableJobs) {
        throw new Error('Candidate profile and available jobs are required');
      }

      const prompt = this.buildJobRecommendationsPrompt(candidateProfile, availableJobs);
      
      logger.debug('Generating job recommendations with Gemini');

      const result = await this.executeWithRetry(async () => {
        const response = await this.generativeModel.generateContent(prompt);
        const text = response.response.text();
        return this.parseJobRecommendations(text);
      });

      logger.debug(`Generated ${result.recommendations.length} job recommendations`);
      return result;

    } catch (error) {
      logger.error('Job recommendations generation error:', error);
      throw new Error(`Failed to generate job recommendations: ${error.message}`);
    }
  }

  /**
   * Analyze resume for ATS compatibility
   */
  async analyzeATSCompatibility(resumeContent) {
    try {
      if (!resumeContent) {
        throw new Error('Resume content is required');
      }

      const prompt = this.buildATSAnalysisPrompt(resumeContent);
      
      logger.debug('Analyzing ATS compatibility with Gemini');

      const result = await this.executeWithRetry(async () => {
        const response = await this.generativeModel.generateContent(prompt);
        const text = response.response.text();
        return this.parseATSAnalysis(text);
      });

      logger.debug(`ATS analysis completed with score: ${result.score}`);
      return result;

    } catch (error) {
      logger.error('ATS analysis error:', error);
      throw new Error(`Failed to analyze ATS compatibility: ${error.message}`);
    }
  }

  /**
   * Extract skills from resume content
   */
  async extractSkills(resumeContent) {
    try {
      if (!resumeContent) {
        throw new Error('Resume content is required');
      }

      const prompt = this.buildSkillExtractionPrompt(resumeContent);
      
      logger.debug('Extracting skills with Gemini');

      const result = await this.executeWithRetry(async () => {
        const response = await this.generativeModel.generateContent(prompt);
        const text = response.response.text();
        return this.parseExtractedSkills(text);
      });

      logger.debug(`Extracted ${result.skills.length} skills`);
      return result;

    } catch (error) {
      logger.error('Skill extraction error:', error);
      throw new Error(`Failed to extract skills: ${error.message}`);
    }
  }

  /**
   * Generate job description optimization suggestions
   */
  async optimizeJobDescription(jobDescription) {
    try {
      if (!jobDescription) {
        throw new Error('Job description is required');
      }

      const prompt = this.buildJobOptimizationPrompt(jobDescription);
      
      logger.debug('Optimizing job description with Gemini');

      const result = await this.executeWithRetry(async () => {
        const response = await this.generativeModel.generateContent(prompt);
        const text = response.response.text();
        return this.parseJobOptimization(text);
      });

      logger.debug('Job description optimization completed');
      return result;

    } catch (error) {
      logger.error('Job description optimization error:', error);
      throw new Error(`Failed to optimize job description: ${error.message}`);
    }
  }

  /**
   * Execute function with retry logic
   */
  async executeWithRetry(fn, retries = this.maxRetries) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        )
      ]);
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        logger.warn(`Retrying Gemini API call. Retries left: ${retries - 1}`);
        await this.delay(this.retryDelay * (this.maxRetries - retries + 1));
        return this.executeWithRetry(fn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableErrors = [
      'RATE_LIMIT_EXCEEDED',
      'SERVICE_UNAVAILABLE',
      'TIMEOUT',
      'NETWORK_ERROR',
      'Request timeout'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message.includes(retryableError) || 
      error.code === retryableError
    );
  }

  /**
   * Preprocess text for better AI processing
   */
  preprocessText(text) {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,;:!()\-]/g, '')
      .substring(0, 8000); // Limit text length for API
  }

  /**
   * Build prompt for resume suggestions
   */
  buildResumeSuggestionsPrompt(resumeContent) {
    return `
Analyze the following resume and provide improvement suggestions in JSON format:

Resume Content:
${resumeContent}

Please provide suggestions in the following JSON structure:
{
  "suggestions": [
    {
      "type": "content|formatting|keywords|structure|grammar",
      "priority": "critical|high|medium|low",
      "title": "Brief title",
      "description": "Detailed description",
      "section": "section name",
      "impact": "high|medium|low",
      "category": "specific category"
    }
  ],
  "missingSkills": ["skill1", "skill2"],
  "keywordGaps": ["keyword1", "keyword2"],
  "atsScore": 85,
  "overallFeedback": "General feedback about the resume"
}

Focus on:
1. ATS compatibility issues
2. Missing keywords and skills
3. Grammar and formatting improvements
4. Content structure and organization
5. Quantifiable achievements
6. Action verb usage
`;
  }

  /**
   * Build prompt for job recommendations
   */
  buildJobRecommendationsPrompt(candidateProfile, availableJobs) {
    const jobSummaries = availableJobs.slice(0, 10).map(job => ({
      id: job._id,
      title: job.title,
      company: job.company.name,
      requirements: job.requirements?.slice(0, 5),
      skills: job.skills?.slice(0, 10)
    }));

    return `
Based on the candidate profile below, rank and recommend the most suitable jobs from the available positions.

Candidate Profile:
Skills: ${candidateProfile.skills?.join(', ') || 'Not specified'}
Experience: ${candidateProfile.experience?.map(exp => `${exp.position} at ${exp.company}`).join(', ') || 'Not specified'}
Education: ${candidateProfile.education?.map(edu => `${edu.degree} from ${edu.institution}`).join(', ') || 'Not specified'}
Preferences: ${JSON.stringify(candidateProfile.preferences || {})}

Available Jobs:
${JSON.stringify(jobSummaries, null, 2)}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "jobId": "job_id",
      "matchScore": 85,
      "matchReasons": ["reason1", "reason2"],
      "skillsMatch": ["matching_skill1", "matching_skill2"],
      "missingSkills": ["missing_skill1", "missing_skill2"],
      "recommendation": "Why this job is a good fit"
    }
  ]
}

Rank jobs by compatibility (0-100%) considering skills match, experience level, and preferences.
`;
  }

  /**
   * Build prompt for ATS analysis
   */
  buildATSAnalysisPrompt(resumeContent) {
    return `
Analyze the following resume for ATS (Applicant Tracking System) compatibility and provide a detailed assessment:

Resume Content:
${resumeContent}

Provide analysis in JSON format:
{
  "score": 85,
  "factors": {
    "formatting": {
      "score": 90,
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    },
    "keywords": {
      "score": 80,
      "found": ["keyword1", "keyword2"],
      "missing": ["missing1", "missing2"],
      "suggestions": ["Add more industry keywords"]
    },
    "structure": {
      "score": 85,
      "issues": ["structure issue"],
      "suggestions": ["structure suggestion"]
    },
    "readability": {
      "score": 90,
      "issues": ["readability issue"],
      "suggestions": ["readability suggestion"]
    }
  },
  "overallFeedback": "Comprehensive feedback about ATS compatibility"
}

Evaluate:
1. File format compatibility
2. Keyword density and relevance
3. Section structure and organization
4. Text readability and parsing
5. Contact information completeness
`;
  }

  /**
   * Build prompt for skill extraction
   */
  buildSkillExtractionPrompt(resumeContent) {
    return `
Extract all technical and soft skills from the following resume content:

Resume Content:
${resumeContent}

Provide extracted skills in JSON format:
{
  "skills": [
    {
      "skill": "JavaScript",
      "category": "technical",
      "confidence": 0.95,
      "context": "Listed in skills section"
    },
    {
      "skill": "Leadership",
      "category": "soft",
      "confidence": 0.8,
      "context": "Mentioned in experience description"
    }
  ],
  "categories": {
    "technical": ["JavaScript", "Python", "React"],
    "soft": ["Leadership", "Communication"],
    "tools": ["Git", "Docker"],
    "frameworks": ["React", "Node.js"],
    "languages": ["English", "Spanish"]
  }
}

Categories: technical, soft, tools, frameworks, languages, certifications
Confidence: 0.0-1.0 based on how clearly the skill is mentioned
`;
  }

  /**
   * Build prompt for job description optimization
   */
  buildJobOptimizationPrompt(jobDescription) {
    return `
Analyze and optimize the following job description for better candidate attraction and ATS compatibility:

Job Description:
${jobDescription}

Provide optimization suggestions in JSON format:
{
  "optimizedDescription": "Improved version of the job description",
  "suggestions": [
    {
      "type": "keywords|structure|requirements|benefits",
      "priority": "high|medium|low",
      "current": "current text",
      "suggested": "suggested improvement",
      "reason": "explanation of why this improves the description"
    }
  ],
  "keywordSuggestions": ["keyword1", "keyword2"],
  "improvementScore": 85,
  "feedback": "Overall feedback about the job description"
}

Focus on:
1. Clear and engaging job title
2. Compelling company description
3. Specific requirements and qualifications
4. Attractive benefits and perks
5. Inclusive language
6. Industry-relevant keywords
`;
  }

  /**
   * Parse resume suggestions response
   */
  parseResumeSuggestions(text) {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid suggestions format');
      }

      return {
        suggestions: parsed.suggestions,
        missingSkills: parsed.missingSkills || [],
        keywordGaps: parsed.keywordGaps || [],
        atsScore: parsed.atsScore || 0,
        overallFeedback: parsed.overallFeedback || ''
      };

    } catch (error) {
      logger.error('Error parsing resume suggestions:', error);
      return {
        suggestions: [],
        missingSkills: [],
        keywordGaps: [],
        atsScore: 0,
        overallFeedback: 'Unable to parse AI response'
      };
    }
  }

  /**
   * Parse job recommendations response
   */
  parseJobRecommendations(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        recommendations: parsed.recommendations || []
      };

    } catch (error) {
      logger.error('Error parsing job recommendations:', error);
      return {
        recommendations: []
      };
    }
  }

  /**
   * Parse ATS analysis response
   */
  parseATSAnalysis(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        score: parsed.score || 0,
        factors: parsed.factors || {},
        overallFeedback: parsed.overallFeedback || ''
      };

    } catch (error) {
      logger.error('Error parsing ATS analysis:', error);
      return {
        score: 0,
        factors: {},
        overallFeedback: 'Unable to parse AI response'
      };
    }
  }

  /**
   * Parse extracted skills response
   */
  parseExtractedSkills(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        skills: parsed.skills || [],
        categories: parsed.categories || {}
      };

    } catch (error) {
      logger.error('Error parsing extracted skills:', error);
      return {
        skills: [],
        categories: {}
      };
    }
  }

  /**
   * Parse job optimization response
   */
  parseJobOptimization(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        optimizedDescription: parsed.optimizedDescription || '',
        suggestions: parsed.suggestions || [],
        keywordSuggestions: parsed.keywordSuggestions || [],
        improvementScore: parsed.improvementScore || 0,
        feedback: parsed.feedback || ''
      };

    } catch (error) {
      logger.error('Error parsing job optimization:', error);
      return {
        optimizedDescription: '',
        suggestions: [],
        keywordSuggestions: [],
        improvementScore: 0,
        feedback: 'Unable to parse AI response'
      };
    }
  }

  /**
   * Utility function to add delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for Gemini service
   */
  async healthCheck() {
    try {
      const testText = "This is a test for health check";
      await this.generateEmbedding(testText);
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('Gemini health check failed:', error);
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

// Export singleton instance
const geminiService = new GeminiService();

module.exports = {
  geminiService,
  GeminiService
};
