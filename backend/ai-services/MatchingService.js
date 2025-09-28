const cosineSimilarity = require('cosine-similarity');
const { euclidean } = require('ml-distance');
const { geminiService } = require('./GeminiService');
const logger = require('../src/utils/logger');

/**
 * AI-Powered Matching Service
 * Handles semantic matching between resumes and jobs using embeddings
 */
class MatchingService {
  constructor() {
    this.minMatchScore = parseInt(process.env.MIN_MATCH_SCORE) || 50;
    this.maxRecommendations = parseInt(process.env.MAX_RECOMMENDATIONS) || 10;
    
    // Weights for different matching factors
    this.matchWeights = {
      semantic: 0.4,      // Semantic similarity via embeddings
      skills: 0.25,       // Direct skills matching
      experience: 0.2,    // Experience level matching
      keywords: 0.15      // Keyword matching
    };
  }

  /**
   * Calculate match score between a resume and job
   */
  async calculateMatchScore(resume, job) {
    try {
      logger.debug(`Calculating match score between resume ${resume._id} and job ${job._id}`);

      const scores = {
        semantic: 0,
        skills: 0,
        experience: 0,
        keywords: 0
      };

      // 1. Semantic similarity using embeddings
      if (resume.embedding && job.embedding) {
        scores.semantic = this.calculateSemanticSimilarity(resume.embedding, job.embedding);
      } else {
        // Generate embeddings if not available
        await this.ensureEmbeddings(resume, job);
        if (resume.embedding && job.embedding) {
          scores.semantic = this.calculateSemanticSimilarity(resume.embedding, job.embedding);
        }
      }

      // 2. Skills matching
      scores.skills = this.calculateSkillsMatch(resume, job);

      // 3. Experience level matching
      scores.experience = this.calculateExperienceMatch(resume, job);

      // 4. Keywords matching
      scores.keywords = this.calculateKeywordsMatch(resume, job);

      // Calculate weighted overall score
      const overallScore = Math.round(
        scores.semantic * this.matchWeights.semantic +
        scores.skills * this.matchWeights.skills +
        scores.experience * this.matchWeights.experience +
        scores.keywords * this.matchWeights.keywords
      );

      const matchDetails = {
        overallScore,
        breakdown: scores,
        weights: this.matchWeights,
        matchedSkills: this.getMatchedSkills(resume, job),
        missingSkills: this.getMissingSkills(resume, job),
        experienceGap: this.getExperienceGap(resume, job),
        recommendations: this.generateMatchRecommendations(scores, resume, job)
      };

      logger.debug(`Match score calculated: ${overallScore}%`);
      return matchDetails;

    } catch (error) {
      logger.error('Match score calculation error:', error);
      throw new Error(`Failed to calculate match score: ${error.message}`);
    }
  }

  /**
   * Find best job matches for a resume
   */
  async findJobMatches(resume, jobs, limit = this.maxRecommendations) {
    try {
      logger.info(`Finding job matches for resume ${resume._id} from ${jobs.length} jobs`);

      const matches = [];

      for (const job of jobs) {
        try {
          const matchDetails = await this.calculateMatchScore(resume, job);
          
          if (matchDetails.overallScore >= this.minMatchScore) {
            matches.push({
              job: {
                id: job._id,
                title: job.title,
                company: job.company,
                location: job.location,
                employmentType: job.employmentType,
                salary: job.salary,
                postedAt: job.createdAt
              },
              ...matchDetails
            });
          }
        } catch (error) {
          logger.warn(`Error calculating match for job ${job._id}:`, error.message);
          continue;
        }
      }

      // Sort by overall score descending
      matches.sort((a, b) => b.overallScore - a.overallScore);

      // Limit results
      const topMatches = matches.slice(0, limit);

      logger.info(`Found ${topMatches.length} job matches above ${this.minMatchScore}% threshold`);

      return {
        matches: topMatches,
        totalJobs: jobs.length,
        matchingJobs: matches.length,
        topMatches: topMatches.length,
        threshold: this.minMatchScore,
        summary: this.generateMatchSummary(topMatches)
      };

    } catch (error) {
      logger.error('Job matching error:', error);
      throw new Error(`Failed to find job matches: ${error.message}`);
    }
  }

  /**
   * Find best candidate matches for a job
   */
  async findCandidateMatches(job, resumes, limit = this.maxRecommendations) {
    try {
      logger.info(`Finding candidate matches for job ${job._id} from ${resumes.length} resumes`);

      const matches = [];

      for (const resume of resumes) {
        try {
          const matchDetails = await this.calculateMatchScore(resume, job);
          
          if (matchDetails.overallScore >= this.minMatchScore) {
            matches.push({
              candidate: {
                id: resume.userId,
                resume: {
                  id: resume._id,
                  name: resume.originalName,
                  atsScore: resume.atsScore,
                  uploadedAt: resume.createdAt
                },
                profile: resume.parsedContent?.personalInfo || {},
                skills: this.extractCandidateSkills(resume),
                experience: this.extractCandidateExperience(resume)
              },
              ...matchDetails
            });
          }
        } catch (error) {
          logger.warn(`Error calculating match for resume ${resume._id}:`, error.message);
          continue;
        }
      }

      // Sort by overall score descending
      matches.sort((a, b) => b.overallScore - a.overallScore);

      // Limit results
      const topMatches = matches.slice(0, limit);

      logger.info(`Found ${topMatches.length} candidate matches above ${this.minMatchScore}% threshold`);

      return {
        matches: topMatches,
        totalCandidates: resumes.length,
        matchingCandidates: matches.length,
        topMatches: topMatches.length,
        threshold: this.minMatchScore,
        summary: this.generateCandidateMatchSummary(topMatches)
      };

    } catch (error) {
      logger.error('Candidate matching error:', error);
      throw new Error(`Failed to find candidate matches: ${error.message}`);
    }
  }

  /**
   * Calculate semantic similarity using cosine similarity
   */
  calculateSemanticSimilarity(embedding1, embedding2) {
    try {
      if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
        return 0;
      }

      const similarity = cosineSimilarity(embedding1, embedding2);
      
      // Convert to percentage (cosine similarity ranges from -1 to 1)
      return Math.max(0, Math.round((similarity + 1) * 50));

    } catch (error) {
      logger.warn('Semantic similarity calculation error:', error);
      return 0;
    }
  }

  /**
   * Calculate skills matching score
   */
  calculateSkillsMatch(resume, job) {
    try {
      const resumeSkills = this.extractResumeSkills(resume);
      const jobSkills = job.skills || [];

      if (resumeSkills.length === 0 || jobSkills.length === 0) {
        return 0;
      }

      // Normalize skills for comparison
      const normalizedResumeSkills = resumeSkills.map(skill => skill.toLowerCase().trim());
      const normalizedJobSkills = jobSkills.map(skill => skill.toLowerCase().trim());

      // Calculate exact matches
      const exactMatches = normalizedResumeSkills.filter(skill => 
        normalizedJobSkills.includes(skill)
      ).length;

      // Calculate partial matches (fuzzy matching)
      const partialMatches = this.calculatePartialSkillMatches(
        normalizedResumeSkills, 
        normalizedJobSkills
      );

      // Calculate score
      const totalMatches = exactMatches + (partialMatches * 0.5);
      const skillsScore = Math.round((totalMatches / jobSkills.length) * 100);

      return Math.min(100, skillsScore);

    } catch (error) {
      logger.warn('Skills matching calculation error:', error);
      return 0;
    }
  }

  /**
   * Calculate experience level matching
   */
  calculateExperienceMatch(resume, job) {
    try {
      const resumeExperience = this.calculateTotalExperience(resume);
      const jobRequiredExperience = this.extractRequiredExperience(job);

      if (jobRequiredExperience === 0) {
        return 100; // No experience requirement
      }

      if (resumeExperience === 0) {
        return jobRequiredExperience <= 1 ? 80 : 20; // Entry level consideration
      }

      // Calculate experience match
      const experienceRatio = resumeExperience / jobRequiredExperience;

      if (experienceRatio >= 1) {
        return 100; // Meets or exceeds requirement
      } else if (experienceRatio >= 0.8) {
        return 90; // Close to requirement
      } else if (experienceRatio >= 0.6) {
        return 75; // Somewhat below requirement
      } else if (experienceRatio >= 0.4) {
        return 50; // Significantly below requirement
      } else {
        return 25; // Well below requirement
      }

    } catch (error) {
      logger.warn('Experience matching calculation error:', error);
      return 50; // Default score on error
    }
  }

  /**
   * Calculate keywords matching score
   */
  calculateKeywordsMatch(resume, job) {
    try {
      const resumeKeywords = resume.keywords || [];
      const jobKeywords = this.extractJobKeywords(job);

      if (resumeKeywords.length === 0 || jobKeywords.length === 0) {
        return 0;
      }

      const matchingKeywords = resumeKeywords.filter(keyword =>
        jobKeywords.some(jobKeyword =>
          jobKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(jobKeyword.toLowerCase())
        )
      );

      const keywordsScore = Math.round((matchingKeywords.length / jobKeywords.length) * 100);
      return Math.min(100, keywordsScore);

    } catch (error) {
      logger.warn('Keywords matching calculation error:', error);
      return 0;
    }
  }

  /**
   * Ensure embeddings exist for resume and job
   */
  async ensureEmbeddings(resume, job) {
    try {
      const promises = [];

      if (!resume.embedding && resume.parsedContent?.rawText) {
        promises.push(this.generateResumeEmbedding(resume));
      }

      if (!job.embedding) {
        promises.push(this.generateJobEmbedding(job));
      }

      await Promise.all(promises);

    } catch (error) {
      logger.warn('Error ensuring embeddings:', error);
    }
  }

  /**
   * Generate embedding for resume
   */
  async generateResumeEmbedding(resume) {
    try {
      const content = this.buildResumeEmbeddingContent(resume);
      const embedding = await geminiService.generateEmbedding(content);
      
      // Update resume with embedding (this would be done in the controller)
      resume.embedding = embedding;
      
      return embedding;
    } catch (error) {
      logger.error('Resume embedding generation error:', error);
      return null;
    }
  }

  /**
   * Generate embedding for job
   */
  async generateJobEmbedding(job) {
    try {
      const content = this.buildJobEmbeddingContent(job);
      const embedding = await geminiService.generateEmbedding(content);
      
      // Update job with embedding (this would be done in the controller)
      job.embedding = embedding;
      
      return embedding;
    } catch (error) {
      logger.error('Job embedding generation error:', error);
      return null;
    }
  }

  /**
   * Build content for resume embedding
   */
  buildResumeEmbeddingContent(resume) {
    const parts = [];

    if (resume.parsedContent?.personalInfo?.summary) {
      parts.push(`Summary: ${resume.parsedContent.personalInfo.summary}`);
    }

    if (resume.parsedContent?.experience) {
      const experience = resume.parsedContent.experience
        .map(exp => `${exp.position} at ${exp.company}: ${exp.description || ''}`)
        .join('. ');
      parts.push(`Experience: ${experience}`);
    }

    if (resume.parsedContent?.skills?.technical) {
      parts.push(`Technical Skills: ${resume.parsedContent.skills.technical.join(', ')}`);
    }

    if (resume.parsedContent?.education) {
      const education = resume.parsedContent.education
        .map(edu => `${edu.degree} from ${edu.institution}`)
        .join('. ');
      parts.push(`Education: ${education}`);
    }

    return parts.join('. ');
  }

  /**
   * Build content for job embedding
   */
  buildJobEmbeddingContent(job) {
    const parts = [];

    parts.push(`Job Title: ${job.title}`);
    parts.push(`Company: ${job.company.name}`);
    parts.push(`Description: ${job.description}`);

    if (job.requirements && job.requirements.length > 0) {
      parts.push(`Requirements: ${job.requirements.join('. ')}`);
    }

    if (job.responsibilities && job.responsibilities.length > 0) {
      parts.push(`Responsibilities: ${job.responsibilities.join('. ')}`);
    }

    if (job.skills && job.skills.length > 0) {
      parts.push(`Required Skills: ${job.skills.join(', ')}`);
    }

    return parts.join('. ');
  }

  /**
   * Extract skills from resume
   */
  extractResumeSkills(resume) {
    const skills = [];

    if (resume.extractedSkills) {
      skills.push(...resume.extractedSkills.map(s => s.skill));
    }

    if (resume.parsedContent?.skills?.technical) {
      skills.push(...resume.parsedContent.skills.technical);
    }

    if (resume.parsedContent?.skills?.soft) {
      skills.push(...resume.parsedContent.skills.soft);
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Calculate partial skill matches using fuzzy matching
   */
  calculatePartialSkillMatches(resumeSkills, jobSkills) {
    let partialMatches = 0;

    for (const jobSkill of jobSkills) {
      for (const resumeSkill of resumeSkills) {
        if (this.calculateStringSimilarity(jobSkill, resumeSkill) > 0.7) {
          partialMatches++;
          break;
        }
      }
    }

    return partialMatches;
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate total years of experience from resume
   */
  calculateTotalExperience(resume) {
    if (!resume.parsedContent?.experience) return 0;

    let totalYears = 0;

    for (const exp of resume.parsedContent.experience) {
      if (exp.startDate) {
        const startYear = this.extractYearFromDate(exp.startDate);
        const endYear = exp.current ? new Date().getFullYear() : this.extractYearFromDate(exp.endDate);
        
        if (startYear && endYear) {
          totalYears += Math.max(0, endYear - startYear);
        }
      }
    }

    return totalYears;
  }

  /**
   * Extract required experience from job
   */
  extractRequiredExperience(job) {
    // Look for experience requirements in job description or requirements
    const text = `${job.description} ${job.requirements?.join(' ') || ''}`.toLowerCase();
    
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*of?\s*experience/i,
      /(\d+)\+?\s*years?\s*experience/i,
      /minimum\s*(\d+)\s*years?/i,
      /at\s*least\s*(\d+)\s*years?/i
    ];

    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Default based on experience level
    switch (job.experienceLevel) {
      case 'entry': return 0;
      case 'mid': return 3;
      case 'senior': return 7;
      case 'lead': return 10;
      case 'executive': return 15;
      default: return 0;
    }
  }

  /**
   * Extract year from date string
   */
  extractYearFromDate(dateStr) {
    if (!dateStr) return null;
    
    const yearMatch = dateStr.toString().match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1]) : null;
  }

  /**
   * Extract keywords from job
   */
  extractJobKeywords(job) {
    const keywords = [];

    // Add skills as keywords
    if (job.skills) {
      keywords.push(...job.skills);
    }

    // Extract keywords from description
    if (job.description) {
      const descriptionKeywords = job.description
        .toLowerCase()
        .match(/\b\w{3,}\b/g) || [];
      keywords.push(...descriptionKeywords);
    }

    // Add requirements as keywords
    if (job.requirements) {
      job.requirements.forEach(req => {
        const reqKeywords = req.toLowerCase().match(/\b\w{3,}\b/g) || [];
        keywords.push(...reqKeywords);
      });
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Get matched skills between resume and job
   */
  getMatchedSkills(resume, job) {
    const resumeSkills = this.extractResumeSkills(resume).map(s => s.toLowerCase());
    const jobSkills = (job.skills || []).map(s => s.toLowerCase());

    return jobSkills.filter(skill => 
      resumeSkills.some(resumeSkill => 
        resumeSkill.includes(skill) || skill.includes(resumeSkill)
      )
    );
  }

  /**
   * Get missing skills (job requirements not in resume)
   */
  getMissingSkills(resume, job) {
    const resumeSkills = this.extractResumeSkills(resume).map(s => s.toLowerCase());
    const jobSkills = (job.skills || []).map(s => s.toLowerCase());

    return jobSkills.filter(skill => 
      !resumeSkills.some(resumeSkill => 
        resumeSkill.includes(skill) || skill.includes(resumeSkill)
      )
    );
  }

  /**
   * Get experience gap analysis
   */
  getExperienceGap(resume, job) {
    const resumeExp = this.calculateTotalExperience(resume);
    const requiredExp = this.extractRequiredExperience(job);

    return {
      resumeExperience: resumeExp,
      requiredExperience: requiredExp,
      gap: Math.max(0, requiredExp - resumeExp),
      meetsRequirement: resumeExp >= requiredExp
    };
  }

  /**
   * Generate match recommendations
   */
  generateMatchRecommendations(scores, resume, job) {
    const recommendations = [];

    if (scores.skills < 70) {
      recommendations.push({
        type: 'skills',
        priority: 'high',
        message: 'Consider developing the missing skills for this role',
        action: 'skill_development'
      });
    }

    if (scores.experience < 60) {
      recommendations.push({
        type: 'experience',
        priority: 'medium',
        message: 'Highlight relevant experience and transferable skills',
        action: 'experience_emphasis'
      });
    }

    if (scores.keywords < 50) {
      recommendations.push({
        type: 'keywords',
        priority: 'medium',
        message: 'Update resume with relevant industry keywords',
        action: 'keyword_optimization'
      });
    }

    return recommendations;
  }

  /**
   * Generate match summary
   */
  generateMatchSummary(matches) {
    if (matches.length === 0) {
      return {
        averageScore: 0,
        topScore: 0,
        distribution: { excellent: 0, good: 0, fair: 0 }
      };
    }

    const scores = matches.map(m => m.overallScore);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const topScore = Math.max(...scores);

    const distribution = {
      excellent: scores.filter(s => s >= 80).length,
      good: scores.filter(s => s >= 60 && s < 80).length,
      fair: scores.filter(s => s >= 40 && s < 60).length
    };

    return { averageScore, topScore, distribution };
  }

  /**
   * Generate candidate match summary
   */
  generateCandidateMatchSummary(matches) {
    return this.generateMatchSummary(matches);
  }

  /**
   * Extract candidate skills for display
   */
  extractCandidateSkills(resume) {
    return {
      technical: resume.parsedContent?.skills?.technical || [],
      soft: resume.parsedContent?.skills?.soft || [],
      extracted: resume.extractedSkills?.slice(0, 10) || []
    };
  }

  /**
   * Extract candidate experience for display
   */
  extractCandidateExperience(resume) {
    if (!resume.parsedContent?.experience) return [];

    return resume.parsedContent.experience.map(exp => ({
      position: exp.position,
      company: exp.company,
      duration: `${exp.startDate} - ${exp.endDate || (exp.current ? 'Present' : '')}`,
      current: exp.current
    }));
  }
}

// Export singleton instance
const matchingService = new MatchingService();

module.exports = {
  matchingService,
  MatchingService
};
