const logger = require('../utils/logger');

/**
 * AI Suggestions Service
 * Generates AI-powered suggestions for resume improvement
 */
class AISuggestionsService {
  constructor() {
    this.suggestionTypes = {
      CONTENT: 'content',
      FORMATTING: 'formatting', 
      KEYWORDS: 'keywords',
      STRUCTURE: 'structure',
      GRAMMAR: 'grammar'
    };

    this.priorities = {
      CRITICAL: 'critical',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    };
  }

  /**
   * Generate AI suggestions for resume improvement
   */
  async generateAISuggestions(resume) {
    try {
      const suggestions = [];

      // Content suggestions
      suggestions.push(...await this.generateContentSuggestions(resume));

      // Formatting suggestions
      suggestions.push(...await this.generateFormattingSuggestions(resume));

      // Keyword suggestions
      suggestions.push(...await this.generateKeywordSuggestions(resume));

      // Structure suggestions
      suggestions.push(...await this.generateStructureSuggestions(resume));

      // Grammar suggestions
      suggestions.push(...await this.generateGrammarSuggestions(resume));

      // Sort by priority
      return this.prioritizeSuggestions(suggestions);

    } catch (error) {
      logger.error('AI suggestions generation error:', error);
      throw error;
    }
  }

  /**
   * Generate content-related suggestions
   */
  async generateContentSuggestions(resume) {
    const suggestions = [];
    const { parsedContent } = resume;

    if (!parsedContent) return suggestions;

    // Check for professional summary
    if (!parsedContent.personalInfo?.summary || parsedContent.personalInfo.summary.length < 50) {
      suggestions.push({
        type: this.suggestionTypes.CONTENT,
        priority: this.priorities.HIGH,
        title: 'Add Professional Summary',
        description: 'Include a compelling 2-3 sentence professional summary at the top of your resume to grab recruiters\' attention.',
        section: 'personalInfo',
        impact: 'high',
        category: 'summary'
      });
    }

    // Check work experience descriptions
    if (parsedContent.experience && Array.isArray(parsedContent.experience)) {
      parsedContent.experience.forEach((exp, index) => {
        if (!exp.description || exp.description.length < 100) {
          suggestions.push({
            type: this.suggestionTypes.CONTENT,
            priority: this.priorities.HIGH,
            title: `Expand Experience Description`,
            description: `Add more detailed description for your role at ${exp.company}. Include specific responsibilities and achievements.`,
            section: 'experience',
            impact: 'high',
            category: 'experience-detail'
          });
        }

        // Check for quantifiable achievements
        if (exp.description && !this.hasQuantifiableMetrics(exp.description)) {
          suggestions.push({
            type: this.suggestionTypes.CONTENT,
            priority: this.priorities.MEDIUM,
            title: 'Add Quantifiable Achievements',
            description: `Include specific numbers, percentages, or metrics in your ${exp.position} role to demonstrate impact.`,
            section: 'experience',
            currentText: exp.description,
            suggestedText: 'Add metrics like: "Increased sales by 25%" or "Managed team of 8 developers"',
            impact: 'medium',
            category: 'quantification'
          });
        }

        // Check for weak action verbs
        if (exp.description && this.hasWeakActionVerbs(exp.description)) {
          const weakVerbs = this.findWeakActionVerbs(exp.description);
          suggestions.push({
            type: this.suggestionTypes.CONTENT,
            priority: this.priorities.MEDIUM,
            title: 'Use Stronger Action Verbs',
            description: `Replace weak action verbs with more impactful alternatives in your ${exp.position} description.`,
            section: 'experience',
            currentText: weakVerbs.join(', '),
            suggestedText: 'Use verbs like: achieved, implemented, optimized, spearheaded, transformed',
            impact: 'medium',
            category: 'action-verbs'
          });
        }
      });
    }

    // Check skills section
    if (!parsedContent.skills?.technical || parsedContent.skills.technical.length < 5) {
      suggestions.push({
        type: this.suggestionTypes.CONTENT,
        priority: this.priorities.MEDIUM,
        title: 'Expand Technical Skills',
        description: 'Add more relevant technical skills to improve keyword matching with job descriptions.',
        section: 'skills',
        impact: 'medium',
        category: 'skills-expansion'
      });
    }

    // Check for projects section
    if (!parsedContent.projects || parsedContent.projects.length === 0) {
      suggestions.push({
        type: this.suggestionTypes.CONTENT,
        priority: this.priorities.MEDIUM,
        title: 'Add Projects Section',
        description: 'Include relevant projects to showcase your practical skills and initiative.',
        section: 'projects',
        impact: 'medium',
        category: 'sections'
      });
    }

    return suggestions;
  }

  /**
   * Generate formatting suggestions
   */
  async generateFormattingSuggestions(resume) {
    const suggestions = [];
    const { parsedContent, mimeType, fileSize } = resume;

    // File format suggestions
    if (mimeType !== 'application/pdf') {
      suggestions.push({
        type: this.suggestionTypes.FORMATTING,
        priority: this.priorities.HIGH,
        title: 'Convert to PDF Format',
        description: 'PDF format ensures consistent formatting across different systems and is preferred by most ATS.',
        impact: 'high',
        category: 'file-format'
      });
    }

    // File size suggestions
    const fileSizeMB = fileSize / (1024 * 1024);
    if (fileSizeMB > 2) {
      suggestions.push({
        type: this.suggestionTypes.FORMATTING,
        priority: this.priorities.MEDIUM,
        title: 'Reduce File Size',
        description: 'Large files may have issues with some ATS systems. Consider optimizing images or reducing file size.',
        impact: 'medium',
        category: 'file-size'
      });
    }

    if (parsedContent?.rawText) {
      const text = parsedContent.rawText;

      // Check for consistent bullet points
      const bulletPoints = text.match(/[•\-\*]\s*[^\n]+/g) || [];
      const bulletStyles = bulletPoints.map(bp => bp.charAt(0)).filter((style, index, arr) => arr.indexOf(style) === index);
      
      if (bulletStyles.length > 1) {
        suggestions.push({
          type: this.suggestionTypes.FORMATTING,
          priority: this.priorities.MEDIUM,
          title: 'Use Consistent Bullet Points',
          description: 'Use the same bullet point style throughout your resume for better visual consistency.',
          impact: 'low',
          category: 'bullet-consistency'
        });
      }

      // Check for excessive capitalization
      const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
      if (capsRatio > 0.15) {
        suggestions.push({
          type: this.suggestionTypes.FORMATTING,
          priority: this.priorities.LOW,
          title: 'Reduce Excessive Capitalization',
          description: 'Too many capital letters can make your resume hard to read. Use standard capitalization.',
          impact: 'low',
          category: 'capitalization'
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate keyword suggestions
   */
  async generateKeywordSuggestions(resume) {
    const suggestions = [];
    const { parsedContent, keywords = [] } = resume;

    if (!parsedContent?.rawText) return suggestions;

    const text = parsedContent.rawText.toLowerCase();

    // Industry-specific keywords
    const techKeywords = [
      'agile', 'scrum', 'devops', 'ci/cd', 'api', 'microservices', 'cloud',
      'machine learning', 'artificial intelligence', 'data analysis', 'automation'
    ];

    const missingTechKeywords = techKeywords.filter(keyword => !text.includes(keyword.toLowerCase()));

    if (missingTechKeywords.length > 0) {
      suggestions.push({
        type: this.suggestionTypes.KEYWORDS,
        priority: this.priorities.MEDIUM,
        title: 'Add Relevant Tech Keywords',
        description: `Consider adding these relevant keywords if they apply to your experience: ${missingTechKeywords.slice(0, 5).join(', ')}`,
        section: 'skills',
        impact: 'medium',
        category: 'tech-keywords'
      });
    }

    // Soft skills keywords
    const softSkillsKeywords = [
      'leadership', 'communication', 'problem-solving', 'teamwork', 'collaboration',
      'critical thinking', 'adaptability', 'time management', 'project management'
    ];

    const missingSoftSkills = softSkillsKeywords.filter(skill => !text.includes(skill.toLowerCase()));

    if (missingSoftSkills.length > 5) {
      suggestions.push({
        type: this.suggestionTypes.KEYWORDS,
        priority: this.priorities.LOW,
        title: 'Include Soft Skills',
        description: `Add relevant soft skills to your resume: ${missingSoftSkills.slice(0, 3).join(', ')}`,
        section: 'skills',
        impact: 'low',
        category: 'soft-skills'
      });
    }

    // Industry buzzwords (use sparingly)
    const industryBuzzwords = [
      'innovative', 'strategic', 'results-driven', 'customer-focused', 'detail-oriented'
    ];

    const buzzwordCount = industryBuzzwords.reduce((count, word) => {
      return count + (text.match(new RegExp(word, 'gi')) || []).length;
    }, 0);

    if (buzzwordCount > 5) {
      suggestions.push({
        type: this.suggestionTypes.KEYWORDS,
        priority: this.priorities.LOW,
        title: 'Reduce Generic Buzzwords',
        description: 'Too many generic buzzwords can make your resume less impactful. Focus on specific achievements instead.',
        impact: 'low',
        category: 'buzzwords'
      });
    }

    return suggestions;
  }

  /**
   * Generate structure suggestions
   */
  async generateStructureSuggestions(resume) {
    const suggestions = [];
    const { parsedContent } = resume;

    if (!parsedContent) return suggestions;

    // Check section order
    const text = parsedContent.rawText?.toLowerCase() || '';
    const sectionPositions = {
      summary: text.search(/(?:summary|objective|profile)/),
      experience: text.search(/(?:experience|employment|work)/),
      education: text.search(/education/),
      skills: text.search(/skills/)
    };

    // Ideal order: summary, experience, education, skills
    if (sectionPositions.experience !== -1 && sectionPositions.education !== -1) {
      if (sectionPositions.education < sectionPositions.experience) {
        suggestions.push({
          type: this.suggestionTypes.STRUCTURE,
          priority: this.priorities.MEDIUM,
          title: 'Reorder Resume Sections',
          description: 'Consider placing Work Experience before Education unless you\'re a recent graduate.',
          impact: 'medium',
          category: 'section-order'
        });
      }
    }

    // Check for contact information placement
    if (!parsedContent.personalInfo?.email || !parsedContent.personalInfo?.phone) {
      suggestions.push({
        type: this.suggestionTypes.STRUCTURE,
        priority: this.priorities.CRITICAL,
        title: 'Add Complete Contact Information',
        description: 'Ensure your resume includes your full name, phone number, email address, and location at the top.',
        section: 'personalInfo',
        impact: 'high',
        category: 'contact-info'
      });
    }

    // Check resume length
    const wordCount = parsedContent.rawText?.split(/\s+/).length || 0;
    if (wordCount > 1000) {
      suggestions.push({
        type: this.suggestionTypes.STRUCTURE,
        priority: this.priorities.MEDIUM,
        title: 'Reduce Resume Length',
        description: 'Your resume appears lengthy. Consider condensing to 1-2 pages for better readability.',
        impact: 'medium',
        category: 'length'
      });
    } else if (wordCount < 200) {
      suggestions.push({
        type: this.suggestionTypes.STRUCTURE,
        priority: this.priorities.HIGH,
        title: 'Expand Resume Content',
        description: 'Your resume seems too brief. Add more details about your experience and achievements.',
        impact: 'high',
        category: 'length'
      });
    }

    return suggestions;
  }

  /**
   * Generate grammar and language suggestions
   */
  async generateGrammarSuggestions(resume) {
    const suggestions = [];
    const { parsedContent } = resume;

    if (!parsedContent?.rawText) return suggestions;

    const text = parsedContent.rawText;

    // Check for first person pronouns
    const firstPersonMatches = text.match(/\b(i|me|my|mine)\b/gi);
    if (firstPersonMatches && firstPersonMatches.length > 2) {
      suggestions.push({
        type: this.suggestionTypes.GRAMMAR,
        priority: this.priorities.MEDIUM,
        title: 'Remove First Person Pronouns',
        description: 'Avoid using "I", "me", "my" in your resume. Use bullet points and action verbs instead.',
        currentText: firstPersonMatches.slice(0, 3).join(', '),
        impact: 'medium',
        category: 'pronouns'
      });
    }

    // Check for passive voice
    const passivePatterns = [
      /was\s+\w+ed\b/gi,
      /were\s+\w+ed\b/gi,
      /been\s+\w+ed\b/gi
    ];

    let passiveCount = 0;
    passivePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) passiveCount += matches.length;
    });

    if (passiveCount > 3) {
      suggestions.push({
        type: this.suggestionTypes.GRAMMAR,
        priority: this.priorities.MEDIUM,
        title: 'Use Active Voice',
        description: 'Replace passive voice constructions with active voice and strong action verbs.',
        impact: 'medium',
        category: 'voice'
      });
    }

    // Check for common spelling errors
    const commonErrors = [
      { wrong: /\bteh\b/gi, correct: 'the' },
      { wrong: /\brecieve\b/gi, correct: 'receive' },
      { wrong: /\bmanagment\b/gi, correct: 'management' },
      { wrong: /\boccured\b/gi, correct: 'occurred' },
      { wrong: /\bseperate\b/gi, correct: 'separate' }
    ];

    commonErrors.forEach(error => {
      if (error.wrong.test(text)) {
        suggestions.push({
          type: this.suggestionTypes.GRAMMAR,
          priority: this.priorities.HIGH,
          title: 'Fix Spelling Error',
          description: `Correct spelling error: replace with "${error.correct}"`,
          impact: 'high',
          category: 'spelling'
        });
      }
    });

    return suggestions;
  }

  /**
   * Prioritize suggestions based on impact and type
   */
  prioritizeSuggestions(suggestions) {
    const priorityOrder = {
      [this.priorities.CRITICAL]: 4,
      [this.priorities.HIGH]: 3,
      [this.priorities.MEDIUM]: 2,
      [this.priorities.LOW]: 1
    };

    return suggestions.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Check if text has quantifiable metrics
   */
  hasQuantifiableMetrics(text) {
    const quantifiablePatterns = [
      /\d+%/,
      /\$[\d,]+/,
      /\d+[km]?\+?\s*(users|customers|clients|employees|projects|years)/i,
      /\d+x\s*(faster|better|more|improvement)/i,
      /increased?\s+by\s+\d+/i,
      /reduced?\s+by\s+\d+/i,
      /improved?\s+by\s+\d+/i
    ];

    return quantifiablePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if text has weak action verbs
   */
  hasWeakActionVerbs(text) {
    const weakVerbs = ['did', 'made', 'got', 'worked', 'helped', 'was responsible for'];
    return weakVerbs.some(verb => text.toLowerCase().includes(verb));
  }

  /**
   * Find weak action verbs in text
   */
  findWeakActionVerbs(text) {
    const weakVerbs = ['did', 'made', 'got', 'worked', 'helped', 'was responsible for'];
    return weakVerbs.filter(verb => text.toLowerCase().includes(verb));
  }
}

// Export singleton instance
const aiSuggestionsService = new AISuggestionsService();

module.exports = {
  generateAISuggestions: (resume) => aiSuggestionsService.generateAISuggestions(resume),
  AISuggestionsService
};
