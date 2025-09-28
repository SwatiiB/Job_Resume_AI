const { geminiService } = require('./GeminiService');
const logger = require('../src/utils/logger');

/**
 * Resume AI Service
 * Provides AI-powered resume analysis, suggestions, and optimization
 */
class ResumeAIService {
  constructor() {
    this.analysisCache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour cache
  }

  /**
   * Comprehensive resume analysis using AI
   */
  async analyzeResume(resume) {
    try {
      logger.info(`Starting AI analysis for resume ${resume._id}`);

      const cacheKey = `analysis_${resume._id}_${resume.updatedAt}`;
      
      // Check cache first
      if (this.analysisCache.has(cacheKey)) {
        logger.debug('Returning cached analysis result');
        return this.analysisCache.get(cacheKey);
      }

      const analysisResults = await Promise.all([
        this.analyzeContent(resume),
        this.analyzeATS(resume),
        this.generateSuggestions(resume),
        this.extractSkills(resume),
        this.analyzeKeywords(resume)
      ]);

      const [contentAnalysis, atsAnalysis, suggestions, skillsAnalysis, keywordAnalysis] = analysisResults;

      const comprehensiveAnalysis = {
        resumeId: resume._id,
        analyzedAt: new Date().toISOString(),
        content: contentAnalysis,
        ats: atsAnalysis,
        suggestions: suggestions,
        skills: skillsAnalysis,
        keywords: keywordAnalysis,
        overallScore: this.calculateOverallScore(contentAnalysis, atsAnalysis),
        recommendations: this.generatePriorityRecommendations(suggestions, atsAnalysis)
      };

      // Cache the results
      this.analysisCache.set(cacheKey, comprehensiveAnalysis);
      setTimeout(() => this.analysisCache.delete(cacheKey), this.cacheTimeout);

      logger.info(`AI analysis completed for resume ${resume._id} with score ${comprehensiveAnalysis.overallScore}`);
      return comprehensiveAnalysis;

    } catch (error) {
      logger.error('Resume AI analysis error:', error);
      throw new Error(`Failed to analyze resume: ${error.message}`);
    }
  }

  /**
   * Analyze resume content structure and quality
   */
  async analyzeContent(resume) {
    try {
      if (!resume.parsedContent?.rawText) {
        throw new Error('Resume content not available for analysis');
      }

      const content = this.buildContentForAnalysis(resume);
      const prompt = this.buildContentAnalysisPrompt(content);

      const result = await geminiService.executeWithRetry(async () => {
        const response = await geminiService.generativeModel.generateContent(prompt);
        const text = response.response.text();
        return this.parseContentAnalysis(text);
      });

      return {
        ...result,
        wordCount: this.calculateWordCount(resume.parsedContent.rawText),
        readabilityScore: this.calculateReadabilityScore(resume.parsedContent.rawText),
        structureScore: this.analyzeStructure(resume),
        completenessScore: this.analyzeCompleteness(resume)
      };

    } catch (error) {
      logger.error('Content analysis error:', error);
      return this.getDefaultContentAnalysis();
    }
  }

  /**
   * Analyze ATS compatibility using AI
   */
  async analyzeATS(resume) {
    try {
      const atsResult = await geminiService.analyzeATSCompatibility(
        resume.parsedContent?.rawText || ''
      );

      return {
        ...atsResult,
        fileFormat: this.analyzeFileFormat(resume),
        parsing: this.analyzeParsingQuality(resume),
        formatting: this.analyzeFormatting(resume),
        sections: this.analyzeSections(resume)
      };

    } catch (error) {
      logger.error('ATS analysis error:', error);
      return this.getDefaultATSAnalysis();
    }
  }

  /**
   * Generate AI-powered improvement suggestions
   */
  async generateSuggestions(resume) {
    try {
      const suggestions = await geminiService.generateResumeSuggestions(
        this.buildContentForAnalysis(resume)
      );

      // Enhance suggestions with additional analysis
      const enhancedSuggestions = await this.enhanceSuggestions(suggestions, resume);

      return {
        ...suggestions,
        enhanced: enhancedSuggestions,
        prioritized: this.prioritizeSuggestions(enhancedSuggestions),
        categories: this.categorizeSuggestions(enhancedSuggestions)
      };

    } catch (error) {
      logger.error('Suggestions generation error:', error);
      return this.getDefaultSuggestions();
    }
  }

  /**
   * Extract and analyze skills using AI
   */
  async extractSkills(resume) {
    try {
      const skillsResult = await geminiService.extractSkills(
        resume.parsedContent?.rawText || ''
      );

      return {
        ...skillsResult,
        analysis: this.analyzeSkillsDistribution(skillsResult.skills),
        gaps: await this.identifySkillGaps(skillsResult.skills, resume),
        trends: this.analyzeSkillTrends(skillsResult.skills),
        recommendations: this.generateSkillRecommendations(skillsResult.skills)
      };

    } catch (error) {
      logger.error('Skills extraction error:', error);
      return this.getDefaultSkillsAnalysis();
    }
  }

  /**
   * Analyze keywords and SEO optimization
   */
  async analyzeKeywords(resume) {
    try {
      const keywords = resume.keywords || [];
      const content = resume.parsedContent?.rawText || '';

      const keywordAnalysis = {
        total: keywords.length,
        density: this.calculateKeywordDensity(keywords, content),
        distribution: this.analyzeKeywordDistribution(keywords, resume),
        relevance: await this.analyzeKeywordRelevance(keywords),
        suggestions: await this.generateKeywordSuggestions(keywords, resume),
        seoScore: this.calculateSEOScore(keywords, content)
      };

      return keywordAnalysis;

    } catch (error) {
      logger.error('Keyword analysis error:', error);
      return this.getDefaultKeywordAnalysis();
    }
  }

  /**
   * Generate personalized job recommendations
   */
  async generateJobRecommendations(resume, availableJobs) {
    try {
      const candidateProfile = this.buildCandidateProfile(resume);
      
      const recommendations = await geminiService.generateJobRecommendations(
        candidateProfile,
        availableJobs
      );

      return {
        ...recommendations,
        profile: candidateProfile,
        enhanced: await this.enhanceJobRecommendations(recommendations, resume),
        filters: this.generateRecommendationFilters(candidateProfile)
      };

    } catch (error) {
      logger.error('Job recommendations error:', error);
      return { recommendations: [] };
    }
  }

  /**
   * Optimize resume for specific job
   */
  async optimizeForJob(resume, job) {
    try {
      logger.info(`Optimizing resume ${resume._id} for job ${job._id}`);

      const optimizationPrompt = this.buildJobOptimizationPrompt(resume, job);
      
      const result = await geminiService.executeWithRetry(async () => {
        const response = await geminiService.generativeModel.generateContent(optimizationPrompt);
        const text = response.response.text();
        return this.parseOptimizationResult(text);
      });

      return {
        jobId: job._id,
        jobTitle: job.title,
        company: job.company.name,
        ...result,
        matchScore: await this.calculateJobMatchScore(resume, job),
        optimizedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Job optimization error:', error);
      throw new Error(`Failed to optimize resume for job: ${error.message}`);
    }
  }

  /**
   * Build content for AI analysis
   */
  buildContentForAnalysis(resume) {
    const parts = [];

    if (resume.parsedContent?.personalInfo) {
      const info = resume.parsedContent.personalInfo;
      if (info.summary) parts.push(`Professional Summary: ${info.summary}`);
    }

    if (resume.parsedContent?.experience) {
      const experience = resume.parsedContent.experience
        .map(exp => `${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'}): ${exp.description || ''}`)
        .join('\n');
      parts.push(`Work Experience:\n${experience}`);
    }

    if (resume.parsedContent?.skills?.technical) {
      parts.push(`Technical Skills: ${resume.parsedContent.skills.technical.join(', ')}`);
    }

    if (resume.parsedContent?.education) {
      const education = resume.parsedContent.education
        .map(edu => `${edu.degree} in ${edu.field} from ${edu.institution} (${edu.endDate || 'Present'})`)
        .join('\n');
      parts.push(`Education:\n${education}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Build content analysis prompt
   */
  buildContentAnalysisPrompt(content) {
    return `
Analyze the following resume content for quality, structure, and effectiveness:

${content}

Provide analysis in JSON format:
{
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "contentQuality": {
    "score": 85,
    "feedback": "Overall content feedback"
  },
  "structure": {
    "score": 90,
    "feedback": "Structure feedback"
  },
  "language": {
    "score": 80,
    "feedback": "Language and tone feedback"
  },
  "achievements": {
    "quantified": 3,
    "total": 8,
    "score": 70,
    "feedback": "Achievements analysis"
  }
}

Evaluate:
1. Content quality and relevance
2. Structure and organization
3. Language and professional tone
4. Use of quantified achievements
5. Overall effectiveness
`;
  }

  /**
   * Build job optimization prompt
   */
  buildJobOptimizationPrompt(resume, job) {
    const resumeContent = this.buildContentForAnalysis(resume);
    const jobContent = `
Job Title: ${job.title}
Company: ${job.company.name}
Description: ${job.description}
Requirements: ${job.requirements?.join(', ') || 'Not specified'}
Skills: ${job.skills?.join(', ') || 'Not specified'}
`;

    return `
Optimize the following resume for the specific job posting:

RESUME:
${resumeContent}

JOB POSTING:
${jobContent}

Provide optimization suggestions in JSON format:
{
  "keywordOptimization": {
    "missing": ["keyword1", "keyword2"],
    "suggestions": ["Add keyword1 to skills section", "Incorporate keyword2 in experience"]
  },
  "contentOptimization": {
    "summary": "Optimized professional summary",
    "experienceHighlights": ["highlight1", "highlight2"],
    "skillsToEmphasize": ["skill1", "skill2"]
  },
  "matchImprovements": {
    "before": 65,
    "after": 85,
    "improvements": ["improvement1", "improvement2"]
  },
  "specificSuggestions": [
    {
      "section": "experience",
      "current": "current text",
      "suggested": "optimized text",
      "reason": "why this improves match"
    }
  ]
}
`;
  }

  /**
   * Parse content analysis response
   */
  parseContentAnalysis(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      return this.getDefaultContentAnalysis();
    }
  }

  /**
   * Parse optimization result
   */
  parseOptimizationResult(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      return {
        keywordOptimization: { missing: [], suggestions: [] },
        contentOptimization: {},
        matchImprovements: { before: 0, after: 0, improvements: [] },
        specificSuggestions: []
      };
    }
  }

  /**
   * Calculate overall score
   */
  calculateOverallScore(contentAnalysis, atsAnalysis) {
    const contentScore = contentAnalysis.contentQuality?.score || 0;
    const atsScore = atsAnalysis.score || 0;
    
    return Math.round((contentScore * 0.6) + (atsScore * 0.4));
  }

  /**
   * Generate priority recommendations
   */
  generatePriorityRecommendations(suggestions, atsAnalysis) {
    const recommendations = [];

    // High priority: ATS issues
    if (atsAnalysis.score < 70) {
      recommendations.push({
        priority: 'critical',
        category: 'ats',
        title: 'Improve ATS Compatibility',
        description: 'Your resume may not be properly parsed by ATS systems',
        action: 'ats_optimization'
      });
    }

    // High priority: Missing sections
    if (suggestions.suggestions) {
      const criticalSuggestions = suggestions.suggestions.filter(s => s.priority === 'critical');
      recommendations.push(...criticalSuggestions.map(s => ({
        priority: 'high',
        category: s.type,
        title: s.title,
        description: s.description,
        action: 'content_improvement'
      })));
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Enhance suggestions with additional analysis
   */
  async enhanceSuggestions(suggestions, resume) {
    try {
      const enhanced = suggestions.suggestions.map(suggestion => ({
        ...suggestion,
        impact: this.calculateSuggestionImpact(suggestion, resume),
        difficulty: this.calculateImplementationDifficulty(suggestion),
        timeToImplement: this.estimateImplementationTime(suggestion),
        relatedSuggestions: this.findRelatedSuggestions(suggestion, suggestions.suggestions)
      }));

      return enhanced;
    } catch (error) {
      logger.warn('Error enhancing suggestions:', error);
      return suggestions.suggestions || [];
    }
  }

  /**
   * Calculate suggestion impact
   */
  calculateSuggestionImpact(suggestion, resume) {
    // Simple heuristic based on suggestion type and current resume state
    const impactWeights = {
      'ats': 0.9,
      'keywords': 0.8,
      'content': 0.7,
      'structure': 0.6,
      'formatting': 0.4
    };

    return impactWeights[suggestion.type] || 0.5;
  }

  /**
   * Calculate implementation difficulty
   */
  calculateImplementationDifficulty(suggestion) {
    const difficultyMap = {
      'formatting': 'easy',
      'keywords': 'easy',
      'grammar': 'easy',
      'content': 'medium',
      'structure': 'hard'
    };

    return difficultyMap[suggestion.type] || 'medium';
  }

  /**
   * Estimate implementation time
   */
  estimateImplementationTime(suggestion) {
    const timeMap = {
      'formatting': '5-10 minutes',
      'keywords': '10-15 minutes',
      'grammar': '5-10 minutes',
      'content': '30-60 minutes',
      'structure': '1-2 hours'
    };

    return timeMap[suggestion.type] || '15-30 minutes';
  }

  /**
   * Find related suggestions
   */
  findRelatedSuggestions(suggestion, allSuggestions) {
    return allSuggestions
      .filter(s => s !== suggestion && s.category === suggestion.category)
      .map(s => s.title)
      .slice(0, 3);
  }

  /**
   * Prioritize suggestions
   */
  prioritizeSuggestions(suggestions) {
    return suggestions.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const impactOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      
      const aScore = (priorityOrder[a.priority] || 0) + (impactOrder[a.impact] || 0);
      const bScore = (priorityOrder[b.priority] || 0) + (impactOrder[b.impact] || 0);
      
      return bScore - aScore;
    });
  }

  /**
   * Categorize suggestions
   */
  categorizeSuggestions(suggestions) {
    const categories = {};
    
    suggestions.forEach(suggestion => {
      const category = suggestion.category || suggestion.type;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(suggestion);
    });

    return categories;
  }

  /**
   * Build candidate profile for job recommendations
   */
  buildCandidateProfile(resume) {
    return {
      skills: this.extractResumeSkills(resume),
      experience: resume.parsedContent?.experience || [],
      education: resume.parsedContent?.education || [],
      preferences: {
        jobTypes: ['full-time'], // Default, could be from user profile
        workModes: ['hybrid', 'remote'],
        industries: this.inferPreferredIndustries(resume)
      },
      summary: resume.parsedContent?.personalInfo?.summary || '',
      totalExperience: this.calculateTotalExperience(resume)
    };
  }

  /**
   * Extract resume skills
   */
  extractResumeSkills(resume) {
    const skills = [];
    
    if (resume.extractedSkills) {
      skills.push(...resume.extractedSkills.map(s => s.skill));
    }
    
    if (resume.parsedContent?.skills?.technical) {
      skills.push(...resume.parsedContent.skills.technical);
    }

    return [...new Set(skills)];
  }

  /**
   * Infer preferred industries from resume
   */
  inferPreferredIndustries(resume) {
    // Simple heuristic based on experience companies and skills
    const commonIndustries = ['technology', 'finance', 'healthcare', 'education', 'consulting'];
    
    // This could be enhanced with ML classification
    return commonIndustries.slice(0, 2);
  }

  /**
   * Calculate total years of experience
   */
  calculateTotalExperience(resume) {
    if (!resume.parsedContent?.experience) return 0;

    let totalYears = 0;
    const currentYear = new Date().getFullYear();

    resume.parsedContent.experience.forEach(exp => {
      if (exp.startDate) {
        const startYear = this.extractYear(exp.startDate);
        const endYear = exp.current ? currentYear : this.extractYear(exp.endDate);
        
        if (startYear && endYear) {
          totalYears += Math.max(0, endYear - startYear);
        }
      }
    });

    return totalYears;
  }

  /**
   * Extract year from date string
   */
  extractYear(dateStr) {
    if (!dateStr) return null;
    const match = dateStr.toString().match(/(\d{4})/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Default analysis methods for fallback
   */
  getDefaultContentAnalysis() {
    return {
      strengths: [],
      weaknesses: [],
      contentQuality: { score: 50, feedback: 'Unable to analyze content' },
      structure: { score: 50, feedback: 'Unable to analyze structure' },
      language: { score: 50, feedback: 'Unable to analyze language' },
      achievements: { quantified: 0, total: 0, score: 0, feedback: 'Unable to analyze achievements' }
    };
  }

  getDefaultATSAnalysis() {
    return {
      score: 50,
      factors: {},
      overallFeedback: 'Unable to perform ATS analysis'
    };
  }

  getDefaultSuggestions() {
    return {
      suggestions: [],
      missingSkills: [],
      keywordGaps: [],
      atsScore: 0,
      overallFeedback: 'Unable to generate suggestions'
    };
  }

  getDefaultSkillsAnalysis() {
    return {
      skills: [],
      categories: {},
      analysis: {},
      gaps: [],
      trends: {},
      recommendations: []
    };
  }

  getDefaultKeywordAnalysis() {
    return {
      total: 0,
      density: 0,
      distribution: {},
      relevance: {},
      suggestions: [],
      seoScore: 0
    };
  }

  /**
   * Additional helper methods for comprehensive analysis
   */
  calculateWordCount(text) {
    return text ? text.split(/\s+/).length : 0;
  }

  calculateReadabilityScore(text) {
    if (!text) return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences.length;
    
    // Simple readability score (lower is better for resumes)
    if (avgWordsPerSentence <= 15) return 90;
    if (avgWordsPerSentence <= 20) return 75;
    if (avgWordsPerSentence <= 25) return 60;
    return 40;
  }

  analyzeStructure(resume) {
    let score = 0;
    
    if (resume.parsedContent?.personalInfo?.name) score += 20;
    if (resume.parsedContent?.personalInfo?.email) score += 20;
    if (resume.parsedContent?.experience?.length > 0) score += 30;
    if (resume.parsedContent?.education?.length > 0) score += 15;
    if (resume.parsedContent?.skills?.technical?.length > 0) score += 15;
    
    return score;
  }

  analyzeCompleteness(resume) {
    const requiredSections = [
      'personalInfo.name',
      'personalInfo.email', 
      'personalInfo.phone',
      'experience',
      'education',
      'skills.technical'
    ];

    let completed = 0;
    requiredSections.forEach(section => {
      const parts = section.split('.');
      let current = resume.parsedContent;
      
      for (const part of parts) {
        if (current && current[part]) {
          current = current[part];
        } else {
          current = null;
          break;
        }
      }
      
      if (current) completed++;
    });

    return Math.round((completed / requiredSections.length) * 100);
  }

  analyzeFileFormat(resume) {
    const formatScores = {
      'application/pdf': 100,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 85,
      'application/msword': 70,
      'text/plain': 50
    };

    return {
      format: resume.mimeType,
      score: formatScores[resume.mimeType] || 30,
      recommendation: resume.mimeType !== 'application/pdf' ? 'Consider using PDF format for better compatibility' : null
    };
  }

  analyzeParsingQuality(resume) {
    if (!resume.parsedContent) {
      return { score: 0, issues: ['Content not parsed'] };
    }

    let score = 100;
    const issues = [];

    if (!resume.parsedContent.personalInfo?.name) {
      score -= 20;
      issues.push('Name not detected');
    }

    if (!resume.parsedContent.personalInfo?.email) {
      score -= 15;
      issues.push('Email not detected');
    }

    if (!resume.parsedContent.experience || resume.parsedContent.experience.length === 0) {
      score -= 25;
      issues.push('Work experience not detected');
    }

    return { score: Math.max(0, score), issues };
  }

  analyzeFormatting(resume) {
    // Basic formatting analysis based on parsed content quality
    const text = resume.parsedContent?.rawText || '';
    let score = 100;
    const issues = [];

    // Check for excessive special characters
    const specialCharRatio = (text.match(/[^\w\s.,;:()\-]/g) || []).length / text.length;
    if (specialCharRatio > 0.1) {
      score -= 20;
      issues.push('Too many special characters detected');
    }

    // Check for proper sections
    const hasSections = /(?:experience|education|skills|summary)/i.test(text);
    if (!hasSections) {
      score -= 30;
      issues.push('Resume sections not clearly defined');
    }

    return { score: Math.max(0, score), issues };
  }

  analyzeSections(resume) {
    const sections = {
      personalInfo: !!resume.parsedContent?.personalInfo?.name,
      summary: !!resume.parsedContent?.personalInfo?.summary,
      experience: !!(resume.parsedContent?.experience?.length > 0),
      education: !!(resume.parsedContent?.education?.length > 0),
      skills: !!(resume.parsedContent?.skills?.technical?.length > 0),
      projects: !!(resume.parsedContent?.projects?.length > 0)
    };

    const presentSections = Object.values(sections).filter(Boolean).length;
    const totalSections = Object.keys(sections).length;

    return {
      sections,
      completeness: Math.round((presentSections / totalSections) * 100),
      missing: Object.keys(sections).filter(key => !sections[key])
    };
  }

  calculateKeywordDensity(keywords, content) {
    if (!content || keywords.length === 0) return 0;
    
    const totalWords = content.split(/\s+/).length;
    const keywordOccurrences = keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      return count + (content.match(regex) || []).length;
    }, 0);

    return Math.round((keywordOccurrences / totalWords) * 100 * 100) / 100; // Percentage with 2 decimal places
  }

  analyzeKeywordDistribution(keywords, resume) {
    const distribution = {
      skills: 0,
      experience: 0,
      education: 0,
      summary: 0
    };

    // This would require more sophisticated analysis
    // For now, return a basic distribution
    return distribution;
  }

  async analyzeKeywordRelevance(keywords) {
    // This could use AI to determine keyword relevance
    // For now, return basic relevance scores
    return keywords.reduce((acc, keyword) => {
      acc[keyword] = Math.random() * 0.5 + 0.5; // Random score between 0.5-1
      return acc;
    }, {});
  }

  async generateKeywordSuggestions(keywords, resume) {
    // This could use AI to suggest relevant keywords
    // For now, return basic suggestions
    return [
      'Add more industry-specific keywords',
      'Include action verbs in experience descriptions',
      'Add technical skills relevant to your field'
    ];
  }

  calculateSEOScore(keywords, content) {
    // Basic SEO score calculation
    let score = 0;
    
    if (keywords.length >= 10) score += 30;
    if (keywords.length >= 20) score += 20;
    
    const keywordDensity = this.calculateKeywordDensity(keywords, content);
    if (keywordDensity >= 2 && keywordDensity <= 5) score += 30;
    
    if (content.length >= 500) score += 20;
    
    return Math.min(100, score);
  }

  analyzeSkillsDistribution(skills) {
    const categories = {
      technical: 0,
      soft: 0,
      tools: 0,
      frameworks: 0,
      languages: 0
    };

    skills.forEach(skill => {
      categories[skill.category] = (categories[skill.category] || 0) + 1;
    });

    return categories;
  }

  async identifySkillGaps(skills, resume) {
    // This could use AI to identify missing skills based on industry/role
    // For now, return common skill gaps
    const commonSkills = ['communication', 'leadership', 'problem-solving', 'teamwork'];
    const currentSkills = skills.map(s => s.skill.toLowerCase());
    
    return commonSkills.filter(skill => 
      !currentSkills.some(current => current.includes(skill.toLowerCase()))
    );
  }

  analyzeSkillTrends(skills) {
    // Basic skill trend analysis
    return {
      trending: skills.filter(s => s.confidence > 0.8).slice(0, 5),
      emerging: skills.filter(s => s.category === 'technical').slice(0, 3),
      inDemand: skills.filter(s => s.confidence > 0.7).slice(0, 5)
    };
  }

  generateSkillRecommendations(skills) {
    const recommendations = [];
    
    if (skills.filter(s => s.category === 'soft').length < 3) {
      recommendations.push('Add more soft skills to your resume');
    }
    
    if (skills.filter(s => s.category === 'technical').length < 5) {
      recommendations.push('Include more technical skills relevant to your field');
    }
    
    return recommendations;
  }

  async calculateJobMatchScore(resume, job) {
    // This would use the MatchingService
    // For now, return a basic score
    return Math.floor(Math.random() * 40) + 60; // Random score between 60-100
  }
}

// Export singleton instance
const resumeAIService = new ResumeAIService();

module.exports = {
  resumeAIService,
  ResumeAIService
};
