const logger = require('../utils/logger');

/**
 * ATS Compatibility Analysis Service
 * Analyzes resumes for ATS (Applicant Tracking System) compatibility
 */
class ATSAnalysisService {
  constructor() {
    this.weightings = {
      formatting: 0.25,
      keywords: 0.30,
      structure: 0.25,
      readability: 0.20
    };
  }

  /**
   * Analyze ATS compatibility of a resume
   */
  async analyzeATSCompatibility(resume) {
    try {
      const analysis = {
        score: 0,
        factors: {
          formatting: await this.analyzeFormatting(resume),
          keywords: await this.analyzeKeywords(resume),
          structure: await this.analyzeStructure(resume),
          readability: await this.analyzeReadability(resume)
        }
      };

      // Calculate overall score
      analysis.score = Math.round(
        analysis.factors.formatting.score * this.weightings.formatting +
        analysis.factors.keywords.score * this.weightings.keywords +
        analysis.factors.structure.score * this.weightings.structure +
        analysis.factors.readability.score * this.weightings.readability
      );

      return analysis;

    } catch (error) {
      logger.error('ATS analysis error:', error);
      throw error;
    }
  }

  /**
   * Analyze formatting compatibility
   */
  async analyzeFormatting(resume) {
    const analysis = {
      score: 100,
      issues: [],
      suggestions: []
    };

    try {
      const { mimeType, parsedContent, fileSize } = resume;

      // File type analysis
      if (mimeType === 'application/pdf') {
        analysis.score -= 0; // PDF is good for ATS
      } else if (mimeType.includes('word')) {
        analysis.score -= 5; // Word docs can have formatting issues
        analysis.suggestions.push('Consider using PDF format for better ATS compatibility');
      } else {
        analysis.score -= 15;
        analysis.issues.push('Unsupported file format for some ATS systems');
        analysis.suggestions.push('Use PDF or DOCX format for optimal ATS compatibility');
      }

      // File size analysis
      const fileSizeMB = fileSize / (1024 * 1024);
      if (fileSizeMB > 5) {
        analysis.score -= 10;
        analysis.issues.push('File size too large (over 5MB)');
        analysis.suggestions.push('Reduce file size to under 5MB');
      } else if (fileSizeMB > 2) {
        analysis.score -= 5;
        analysis.suggestions.push('Consider reducing file size for faster processing');
      }

      // Text extraction quality
      if (!parsedContent || !parsedContent.rawText) {
        analysis.score -= 30;
        analysis.issues.push('Text extraction failed or incomplete');
        analysis.suggestions.push('Ensure resume text is selectable and not embedded in images');
      } else {
        const textLength = parsedContent.rawText.length;
        if (textLength < 500) {
          analysis.score -= 20;
          analysis.issues.push('Very little text extracted - possible formatting issues');
          analysis.suggestions.push('Ensure all content is in text format, not images');
        } else if (textLength < 1000) {
          analysis.score -= 10;
          analysis.suggestions.push('Consider adding more detailed content');
        }
      }

      // Check for potential formatting issues
      if (parsedContent?.rawText) {
        const text = parsedContent.rawText;
        
        // Check for excessive special characters
        const specialCharRatio = (text.match(/[^\w\s.,;:()\-]/g) || []).length / text.length;
        if (specialCharRatio > 0.1) {
          analysis.score -= 15;
          analysis.issues.push('Excessive special characters detected');
          analysis.suggestions.push('Use simple formatting and standard characters');
        }

        // Check for tables or complex layouts
        if (text.includes('|') && text.match(/\|/g).length > 10) {
          analysis.score -= 10;
          analysis.issues.push('Complex table formatting detected');
          analysis.suggestions.push('Use simple bullet points instead of tables');
        }

        // Check for headers and footers
        const headerFooterPatterns = [
          /page \d+ of \d+/gi,
          /confidential/gi,
          /resume of/gi
        ];

        headerFooterPatterns.forEach(pattern => {
          if (pattern.test(text)) {
            analysis.score -= 5;
            analysis.suggestions.push('Remove headers and footers for cleaner parsing');
          }
        });
      }

      // Ensure score doesn't go below 0
      analysis.score = Math.max(0, analysis.score);

      return analysis;

    } catch (error) {
      logger.error('Formatting analysis error:', error);
      return {
        score: 50,
        issues: ['Error analyzing formatting'],
        suggestions: ['Ensure resume is in a standard format']
      };
    }
  }

  /**
   * Analyze keywords and content relevance
   */
  async analyzeKeywords(resume) {
    const analysis = {
      score: 0,
      found: [],
      missing: [],
      suggestions: []
    };

    try {
      const { parsedContent, keywords = [] } = resume;
      
      if (!parsedContent?.rawText) {
        return {
          score: 0,
          found: [],
          missing: [],
          suggestions: ['Unable to analyze keywords - text extraction failed']
        };
      }

      const text = parsedContent.rawText.toLowerCase();

      // Common industry keywords to look for
      const importantKeywords = [
        // General professional keywords
        'experience', 'skills', 'management', 'leadership', 'team', 'project',
        'development', 'analysis', 'problem-solving', 'communication',
        
        // Action verbs
        'managed', 'led', 'developed', 'implemented', 'created', 'designed',
        'analyzed', 'improved', 'optimized', 'coordinated', 'collaborated',
        
        // Quantifiable achievements
        'increased', 'decreased', 'reduced', 'improved', 'achieved', 'exceeded',
        'delivered', 'completed', 'successful'
      ];

      // Check for important keywords
      let keywordScore = 0;
      importantKeywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          analysis.found.push(keyword);
          keywordScore += 2;
        } else {
          analysis.missing.push(keyword);
        }
      });

      // Check for quantifiable achievements
      const quantifiablePatterns = [
        /\d+%/g, // Percentages
        /\$[\d,]+/g, // Dollar amounts
        /\d+[km]?\+?\s*(users|customers|clients|employees|projects|years)/gi, // Numbers with units
        /\d+x\s*(faster|better|more|improvement)/gi // Multipliers
      ];

      let quantifiableCount = 0;
      quantifiablePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          quantifiableCount += matches.length;
        }
      });

      if (quantifiableCount > 0) {
        keywordScore += Math.min(20, quantifiableCount * 5);
        analysis.found.push(`${quantifiableCount} quantifiable achievements`);
      } else {
        analysis.missing.push('Quantifiable achievements');
        analysis.suggestions.push('Include specific numbers, percentages, and measurable results');
      }

      // Check for action verbs at the beginning of bullet points
      const bulletPoints = text.match(/[•\-\*]\s*([^\n]+)/g) || [];
      let actionVerbCount = 0;
      const actionVerbs = [
        'achieved', 'administered', 'analyzed', 'collaborated', 'created', 'developed',
        'established', 'evaluated', 'implemented', 'improved', 'increased', 'led',
        'managed', 'optimized', 'organized', 'reduced', 'resolved', 'supervised'
      ];

      bulletPoints.forEach(bullet => {
        const firstWord = bullet.toLowerCase().match(/^\s*[•\-\*]\s*(\w+)/);
        if (firstWord && actionVerbs.includes(firstWord[1])) {
          actionVerbCount++;
        }
      });

      if (actionVerbCount > 0) {
        keywordScore += Math.min(15, actionVerbCount * 2);
        analysis.found.push(`${actionVerbCount} strong action verbs`);
      } else {
        analysis.missing.push('Strong action verbs');
        analysis.suggestions.push('Start bullet points with strong action verbs');
      }

      // Industry-specific keywords bonus
      if (keywords.length > 10) {
        keywordScore += 10;
        analysis.found.push('Good keyword diversity');
      } else if (keywords.length > 5) {
        keywordScore += 5;
      } else {
        analysis.missing.push('Keyword diversity');
        analysis.suggestions.push('Include more relevant industry keywords');
      }

      analysis.score = Math.min(100, keywordScore);

      // Add suggestions based on missing elements
      if (analysis.missing.length > 0) {
        analysis.suggestions.push('Include more relevant keywords from job descriptions');
        analysis.suggestions.push('Use industry-standard terminology');
      }

      return analysis;

    } catch (error) {
      logger.error('Keywords analysis error:', error);
      return {
        score: 50,
        found: [],
        missing: [],
        suggestions: ['Error analyzing keywords']
      };
    }
  }

  /**
   * Analyze structure and organization
   */
  async analyzeStructure(resume) {
    const analysis = {
      score: 0,
      issues: [],
      suggestions: []
    };

    try {
      const { parsedContent } = resume;

      if (!parsedContent) {
        return {
          score: 0,
          issues: ['Unable to analyze structure'],
          suggestions: ['Ensure resume content is properly formatted']
        };
      }

      let structureScore = 0;

      // Check for essential sections
      const essentialSections = [
        { key: 'personalInfo', name: 'Contact Information', weight: 15 },
        { key: 'experience', name: 'Work Experience', weight: 25 },
        { key: 'education', name: 'Education', weight: 15 },
        { key: 'skills', name: 'Skills', weight: 15 }
      ];

      essentialSections.forEach(section => {
        if (parsedContent[section.key]) {
          if (section.key === 'personalInfo') {
            const info = parsedContent.personalInfo;
            if (info.name || info.email || info.phone) {
              structureScore += section.weight;
            } else {
              analysis.issues.push(`${section.name} section incomplete`);
              analysis.suggestions.push(`Complete your ${section.name.toLowerCase()}`);
            }
          } else if (section.key === 'experience') {
            if (Array.isArray(parsedContent.experience) && parsedContent.experience.length > 0) {
              structureScore += section.weight;
              
              // Check experience details
              const hasDetailedExperience = parsedContent.experience.some(exp => 
                exp.company && exp.position && (exp.startDate || exp.description)
              );
              
              if (!hasDetailedExperience) {
                analysis.issues.push('Work experience lacks detail');
                analysis.suggestions.push('Include company names, job titles, and dates for all positions');
              }
            } else {
              analysis.issues.push(`${section.name} section missing or empty`);
              analysis.suggestions.push(`Add your ${section.name.toLowerCase()}`);
            }
          } else if (section.key === 'education') {
            if (Array.isArray(parsedContent.education) && parsedContent.education.length > 0) {
              structureScore += section.weight;
            } else {
              analysis.issues.push(`${section.name} section missing or empty`);
              analysis.suggestions.push(`Add your ${section.name.toLowerCase()}`);
            }
          } else if (section.key === 'skills') {
            const skills = parsedContent.skills;
            if (skills && (skills.technical?.length > 0 || skills.soft?.length > 0)) {
              structureScore += section.weight;
            } else {
              analysis.issues.push(`${section.name} section missing or empty`);
              analysis.suggestions.push(`Add your ${section.name.toLowerCase()}`);
            }
          }
        } else {
          analysis.issues.push(`${section.name} section missing`);
          analysis.suggestions.push(`Add ${section.name.toLowerCase()} section`);
        }
      });

      // Check for optional but valuable sections
      const optionalSections = [
        { key: 'projects', name: 'Projects', weight: 10 },
        { key: 'certifications', name: 'Certifications', weight: 10 },
        { key: 'awards', name: 'Awards', weight: 5 },
        { key: 'volunteering', name: 'Volunteer Experience', weight: 5 }
      ];

      optionalSections.forEach(section => {
        if (parsedContent[section.key] && Array.isArray(parsedContent[section.key]) && parsedContent[section.key].length > 0) {
          structureScore += section.weight;
        }
      });

      // Check for professional summary
      if (parsedContent.personalInfo?.summary) {
        structureScore += 10;
      } else {
        analysis.suggestions.push('Add a professional summary at the top of your resume');
      }

      // Check section order (basic heuristic)
      const text = parsedContent.rawText?.toLowerCase() || '';
      const sectionOrder = [];
      
      const sectionPatterns = [
        { name: 'summary', pattern: /(?:summary|objective|profile)/ },
        { name: 'experience', pattern: /(?:experience|employment|work)/ },
        { name: 'education', pattern: /education/ },
        { name: 'skills', pattern: /skills/ }
      ];

      sectionPatterns.forEach(section => {
        const match = text.search(section.pattern);
        if (match !== -1) {
          sectionOrder.push({ name: section.name, position: match });
        }
      });

      sectionOrder.sort((a, b) => a.position - b.position);

      // Ideal order: summary, experience, education, skills
      const idealOrder = ['summary', 'experience', 'education', 'skills'];
      const actualOrder = sectionOrder.map(s => s.name);
      
      if (JSON.stringify(actualOrder.slice(0, 3)) === JSON.stringify(idealOrder.slice(0, 3))) {
        structureScore += 10;
      } else {
        analysis.suggestions.push('Consider reordering sections: Summary, Experience, Education, Skills');
      }

      analysis.score = Math.min(100, structureScore);

      return analysis;

    } catch (error) {
      logger.error('Structure analysis error:', error);
      return {
        score: 50,
        issues: ['Error analyzing structure'],
        suggestions: ['Ensure resume has clear section headings']
      };
    }
  }

  /**
   * Analyze readability and clarity
   */
  async analyzeReadability(resume) {
    const analysis = {
      score: 0,
      issues: [],
      suggestions: []
    };

    try {
      const { parsedContent } = resume;

      if (!parsedContent?.rawText) {
        return {
          score: 0,
          issues: ['Unable to analyze readability'],
          suggestions: ['Ensure resume text is readable']
        };
      }

      const text = parsedContent.rawText;
      let readabilityScore = 0;

      // Text length analysis
      const wordCount = text.split(/\s+/).length;
      if (wordCount >= 200 && wordCount <= 800) {
        readabilityScore += 20;
      } else if (wordCount < 200) {
        analysis.issues.push('Resume too short');
        analysis.suggestions.push('Add more detail to your experience and achievements');
      } else if (wordCount > 1000) {
        analysis.issues.push('Resume too long');
        analysis.suggestions.push('Condense content to 1-2 pages');
      }

      // Sentence structure analysis
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
      
      if (avgSentenceLength >= 8 && avgSentenceLength <= 20) {
        readabilityScore += 15;
      } else if (avgSentenceLength > 25) {
        analysis.issues.push('Sentences too long');
        analysis.suggestions.push('Use shorter, more concise sentences');
      } else if (avgSentenceLength < 5) {
        analysis.issues.push('Sentences too short');
        analysis.suggestions.push('Provide more detailed descriptions');
      }

      // Bullet points analysis
      const bulletPoints = text.match(/[•\-\*]\s*[^\n]+/g) || [];
      if (bulletPoints.length >= 5) {
        readabilityScore += 15;
      } else {
        analysis.suggestions.push('Use more bullet points to improve readability');
      }

      // Check for consistent formatting
      const bulletPointsConsistent = bulletPoints.every(bp => 
        bp.startsWith('•') || bp.startsWith('-') || bp.startsWith('*')
      );

      if (bulletPointsConsistent && bulletPoints.length > 0) {
        readabilityScore += 10;
      } else if (bulletPoints.length > 0) {
        analysis.issues.push('Inconsistent bullet point formatting');
        analysis.suggestions.push('Use consistent bullet point style throughout');
      }

      // Grammar and spelling check (basic)
      const commonMistakes = [
        { pattern: /\bi\s+/gi, issue: 'Avoid first person pronouns' },
        { pattern: /\bteh\b/gi, issue: 'Spelling error: "teh" should be "the"' },
        { pattern: /\brecieve\b/gi, issue: 'Spelling error: "recieve" should be "receive"' },
        { pattern: /\bmanagment\b/gi, issue: 'Spelling error: "managment" should be "management"' }
      ];

      commonMistakes.forEach(mistake => {
        if (mistake.pattern.test(text)) {
          analysis.issues.push(mistake.issue);
          readabilityScore -= 5;
        }
      });

      // Check for passive voice (basic detection)
      const passivePatterns = [
        /was\s+\w+ed\b/gi,
        /were\s+\w+ed\b/gi,
        /been\s+\w+ed\b/gi
      ];

      let passiveCount = 0;
      passivePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          passiveCount += matches.length;
        }
      });

      if (passiveCount > 3) {
        analysis.issues.push('Too much passive voice');
        analysis.suggestions.push('Use active voice and strong action verbs');
        readabilityScore -= 10;
      }

      // Consistency checks
      const dateFormats = text.match(/\d{1,2}\/\d{4}|\d{4}|\w+\s+\d{4}/g) || [];
      const uniqueDateFormats = [...new Set(dateFormats.map(date => {
        if (date.includes('/')) return 'MM/YYYY';
        if (date.match(/^\d{4}$/)) return 'YYYY';
        return 'Month YYYY';
      }))];

      if (uniqueDateFormats.length > 2) {
        analysis.issues.push('Inconsistent date formatting');
        analysis.suggestions.push('Use consistent date format throughout resume');
      } else {
        readabilityScore += 10;
      }

      // White space and formatting
      const lineBreaks = (text.match(/\n/g) || []).length;
      const textLength = text.length;
      const whiteSpaceRatio = lineBreaks / textLength;

      if (whiteSpaceRatio >= 0.02 && whiteSpaceRatio <= 0.08) {
        readabilityScore += 10;
      } else if (whiteSpaceRatio < 0.02) {
        analysis.issues.push('Text appears too dense');
        analysis.suggestions.push('Add more white space between sections');
      }

      // Professional language check
      const informalWords = [
        'awesome', 'cool', 'stuff', 'things', 'lots of', 'a lot', 'pretty good',
        'really', 'very', 'totally', 'super', 'amazing'
      ];

      informalWords.forEach(word => {
        if (text.toLowerCase().includes(word)) {
          analysis.issues.push(`Informal language detected: "${word}"`);
          analysis.suggestions.push('Use professional language throughout');
          readabilityScore -= 2;
        }
      });

      analysis.score = Math.max(0, Math.min(100, readabilityScore));

      return analysis;

    } catch (error) {
      logger.error('Readability analysis error:', error);
      return {
        score: 50,
        issues: ['Error analyzing readability'],
        suggestions: ['Ensure resume uses clear, professional language']
      };
    }
  }
}

// Export singleton instance
const atsAnalysisService = new ATSAnalysisService();

module.exports = {
  analyzeATSCompatibility: (resume) => atsAnalysisService.analyzeATSCompatibility(resume),
  ATSAnalysisService
};
