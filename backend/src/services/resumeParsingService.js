const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

/**
 * Resume parsing service using multiple libraries for different file types
 */
class ResumeParsingService {
  constructor() {
    this.supportedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
  }

  /**
   * Parse resume content based on file type
   */
  async parseResumeContent(filePath, mimeType) {
    try {
      if (!this.supportedMimeTypes.includes(mimeType)) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      let rawText = '';

      switch (mimeType) {
        case 'application/pdf':
          rawText = await this.parsePDF(filePath);
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          rawText = await this.parseWord(filePath);
          break;
        case 'text/plain':
          rawText = await this.parseText(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Parse structured content from raw text
      const structuredContent = await this.extractStructuredContent(rawText);

      return {
        ...structuredContent,
        rawText,
        parsingStatus: 'completed'
      };

    } catch (error) {
      logger.error('Resume parsing error:', error);
      throw error;
    }
  }

  /**
   * Parse PDF file
   */
  async parsePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      logger.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Parse Word document
   */
  async parseWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      logger.error('Word document parsing error:', error);
      throw new Error('Failed to parse Word document');
    }
  }

  /**
   * Parse plain text file
   */
  async parseText(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      logger.error('Text file parsing error:', error);
      throw new Error('Failed to parse text file');
    }
  }

  /**
   * Extract structured content from raw text using NLP and pattern matching
   */
  async extractStructuredContent(rawText) {
    const content = {
      personalInfo: {},
      experience: [],
      education: [],
      skills: { technical: [], soft: [], languages: [], certifications: [] },
      projects: [],
      awards: [],
      publications: [],
      volunteering: []
    };

    try {
      // Extract personal information
      content.personalInfo = this.extractPersonalInfo(rawText);

      // Extract experience
      content.experience = this.extractExperience(rawText);

      // Extract education
      content.education = this.extractEducation(rawText);

      // Extract skills
      content.skills = this.extractSkills(rawText);

      // Extract projects
      content.projects = this.extractProjects(rawText);

      // Extract awards
      content.awards = this.extractAwards(rawText);

      // Extract publications
      content.publications = this.extractPublications(rawText);

      // Extract volunteering
      content.volunteering = this.extractVolunteering(rawText);

      return content;

    } catch (error) {
      logger.error('Structured content extraction error:', error);
      return content; // Return partial content even if some extraction fails
    }
  }

  /**
   * Extract personal information
   */
  extractPersonalInfo(text) {
    const personalInfo = {};

    // Extract name (usually at the beginning)
    const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/m);
    if (nameMatch) {
      personalInfo.name = nameMatch[1].trim();
    }

    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      personalInfo.email = emailMatch[1];
    }

    // Extract phone
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    if (phoneMatch) {
      personalInfo.phone = phoneMatch[0];
    }

    // Extract LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
    if (linkedinMatch) {
      personalInfo.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
    }

    // Extract GitHub
    const githubMatch = text.match(/github\.com\/([a-zA-Z0-9-]+)/i);
    if (githubMatch) {
      personalInfo.github = `https://github.com/${githubMatch[1]}`;
    }

    // Extract website
    const websiteMatch = text.match(/(https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/);
    if (websiteMatch && !websiteMatch[1].includes('linkedin') && !websiteMatch[1].includes('github')) {
      personalInfo.website = websiteMatch[1];
    }

    // Extract address (basic pattern)
    const addressMatch = text.match(/([A-Z][a-z]+,?\s+[A-Z]{2}\s+\d{5})/);
    if (addressMatch) {
      personalInfo.address = addressMatch[1];
    }

    // Extract summary/objective
    const summaryPatterns = [
      /(?:summary|objective|profile)[\s\n]*:?\s*([^]*?)(?=\n\s*(?:experience|education|skills|employment|work|career))/i,
      /(?:professional\s+summary|career\s+objective|personal\s+statement)[\s\n]*:?\s*([^]*?)(?=\n\s*(?:experience|education|skills|employment|work|career))/i
    ];

    for (const pattern of summaryPatterns) {
      const summaryMatch = text.match(pattern);
      if (summaryMatch) {
        personalInfo.summary = summaryMatch[1].trim().replace(/\n+/g, ' ').substring(0, 500);
        break;
      }
    }

    return personalInfo;
  }

  /**
   * Extract work experience
   */
  extractExperience(text) {
    const experiences = [];
    
    // Look for experience section
    const experienceSection = this.extractSection(text, [
      'experience', 'employment', 'work history', 'professional experience', 
      'career history', 'work experience'
    ]);

    if (!experienceSection) return experiences;

    // Split into individual jobs (look for company patterns)
    const jobPatterns = [
      /([A-Z][^|\n]*?)\s*[\|\-\n]\s*([A-Z][^|\n]*?)\s*[\|\-\n]\s*(\d{1,2}\/\d{4}|\d{4}|\w+\s+\d{4})\s*(?:\-|to|–)\s*(\d{1,2}\/\d{4}|\d{4}|\w+\s+\d{4}|present|current)/gi,
      /([A-Z][^|\n]*?)\s*\n\s*([A-Z][^|\n]*?)\s*\n\s*(\d{1,2}\/\d{4}|\d{4}|\w+\s+\d{4})\s*(?:\-|to|–)\s*(\d{1,2}\/\d{4}|\d{4}|\w+\s+\d{4}|present|current)/gi
    ];

    for (const pattern of jobPatterns) {
      let match;
      while ((match = pattern.exec(experienceSection)) !== null) {
        const experience = {
          position: match[1].trim(),
          company: match[2].trim(),
          startDate: this.parseDate(match[3]),
          endDate: match[4].toLowerCase().includes('present') || match[4].toLowerCase().includes('current') 
            ? null : this.parseDate(match[4]),
          current: match[4].toLowerCase().includes('present') || match[4].toLowerCase().includes('current'),
          description: '',
          achievements: [],
          technologies: []
        };

        experiences.push(experience);
      }
    }

    return experiences;
  }

  /**
   * Extract education
   */
  extractEducation(text) {
    const education = [];
    
    const educationSection = this.extractSection(text, [
      'education', 'academic background', 'qualifications', 'academic qualifications'
    ]);

    if (!educationSection) return education;

    // Look for degree patterns
    const degreePatterns = [
      /(bachelor|master|phd|doctorate|associate|b\.?a\.?|b\.?s\.?|m\.?a\.?|m\.?s\.?|ph\.?d\.?)([^|\n]*?)\s*[\|\-\n]\s*([^|\n]*?)\s*[\|\-\n]\s*(\d{4})/gi,
      /(bachelor|master|phd|doctorate|associate|b\.?a\.?|b\.?s\.?|m\.?a\.?|m\.?s\.?|ph\.?d\.?)([^|\n]*?)\s*\n\s*([^|\n]*?)\s*\n\s*(\d{4})/gi
    ];

    for (const pattern of degreePatterns) {
      let match;
      while ((match = pattern.exec(educationSection)) !== null) {
        const edu = {
          degree: `${match[1]} ${match[2]}`.trim(),
          field: match[2].trim(),
          institution: match[3].trim(),
          endDate: match[4],
          current: false,
          description: ''
        };

        education.push(edu);
      }
    }

    return education;
  }

  /**
   * Extract skills
   */
  extractSkills(text) {
    const skills = {
      technical: [],
      soft: [],
      languages: [],
      certifications: []
    };

    const skillsSection = this.extractSection(text, [
      'skills', 'technical skills', 'core competencies', 'technologies',
      'programming languages', 'tools', 'software', 'expertise'
    ]);

    if (!skillsSection) return skills;

    // Common technical skills patterns
    const technicalSkills = [
      // Programming languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
      'TypeScript', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell', 'Bash',
      
      // Web technologies
      'HTML', 'CSS', 'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask',
      'Spring', 'Laravel', 'Rails', 'ASP.NET', 'jQuery', 'Bootstrap', 'Sass', 'Less',
      
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
      'Cassandra', 'DynamoDB', 'Elasticsearch',
      
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub',
      'GitLab', 'CI/CD', 'Terraform', 'Ansible', 'Chef', 'Puppet',
      
      // Data & Analytics
      'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Tableau', 'Power BI',
      'Apache Spark', 'Hadoop', 'Kafka', 'Airflow'
    ];

    // Extract technical skills
    technicalSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill}\\b`, 'gi');
      if (regex.test(skillsSection)) {
        skills.technical.push(skill);
      }
    });

    // Extract certifications
    const certificationPatterns = [
      /(?:certified|certification|certificate)[\s\w]*(?:in|for)?\s*([A-Z][^|\n.]*)/gi,
      /(AWS|Azure|Google|Microsoft|Oracle|Cisco|CompTIA)\s+[A-Z][^|\n.]*/gi
    ];

    certificationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(skillsSection)) !== null) {
        skills.certifications.push({
          name: match[0].trim(),
          issuer: match[1] || 'Unknown'
        });
      }
    });

    return skills;
  }

  /**
   * Extract projects
   */
  extractProjects(text) {
    const projects = [];
    
    const projectsSection = this.extractSection(text, [
      'projects', 'personal projects', 'side projects', 'portfolio',
      'notable projects', 'key projects'
    ]);

    if (!projectsSection) return projects;

    // Look for project patterns
    const projectLines = projectsSection.split('\n').filter(line => line.trim());
    
    projectLines.forEach(line => {
      // Look for project name patterns
      const projectMatch = line.match(/^([^|\-:]+)[\|\-:]?\s*(.+)?/);
      if (projectMatch) {
        const project = {
          name: projectMatch[1].trim(),
          description: projectMatch[2] ? projectMatch[2].trim() : '',
          technologies: [],
          url: '',
          github: ''
        };

        // Extract GitHub URL
        const githubMatch = line.match(/github\.com\/[^\s]+/i);
        if (githubMatch) {
          project.github = `https://${githubMatch[0]}`;
        }

        // Extract other URLs
        const urlMatch = line.match(/https?:\/\/[^\s]+/);
        if (urlMatch && !urlMatch[0].includes('github')) {
          project.url = urlMatch[0];
        }

        projects.push(project);
      }
    });

    return projects;
  }

  /**
   * Extract awards
   */
  extractAwards(text) {
    const awards = [];
    
    const awardsSection = this.extractSection(text, [
      'awards', 'honors', 'achievements', 'recognitions', 'accolades'
    ]);

    if (!awardsSection) return awards;

    const awardLines = awardsSection.split('\n').filter(line => line.trim());
    
    awardLines.forEach(line => {
      const awardMatch = line.match(/^([^|\-:]+)[\|\-:]?\s*(.+)?/);
      if (awardMatch) {
        awards.push({
          title: awardMatch[1].trim(),
          description: awardMatch[2] ? awardMatch[2].trim() : '',
          issuer: '',
          date: ''
        });
      }
    });

    return awards;
  }

  /**
   * Extract publications
   */
  extractPublications(text) {
    const publications = [];
    
    const publicationsSection = this.extractSection(text, [
      'publications', 'papers', 'research', 'articles', 'journals'
    ]);

    if (!publicationsSection) return publications;

    const pubLines = publicationsSection.split('\n').filter(line => line.trim());
    
    pubLines.forEach(line => {
      publications.push({
        title: line.trim(),
        publisher: '',
        date: '',
        url: '',
        description: ''
      });
    });

    return publications;
  }

  /**
   * Extract volunteering experience
   */
  extractVolunteering(text) {
    const volunteering = [];
    
    const volunteerSection = this.extractSection(text, [
      'volunteer', 'volunteering', 'community service', 'volunteer experience',
      'community involvement', 'social work'
    ]);

    if (!volunteerSection) return volunteering;

    const volunteerLines = volunteerSection.split('\n').filter(line => line.trim());
    
    volunteerLines.forEach(line => {
      const volunteerMatch = line.match(/^([^|\-:]+)[\|\-:]?\s*(.+)?/);
      if (volunteerMatch) {
        volunteering.push({
          organization: volunteerMatch[1].trim(),
          role: volunteerMatch[2] ? volunteerMatch[2].trim() : '',
          description: '',
          current: false
        });
      }
    });

    return volunteering;
  }

  /**
   * Extract a specific section from text
   */
  extractSection(text, sectionNames) {
    for (const sectionName of sectionNames) {
      const pattern = new RegExp(
        `(?:^|\\n)\\s*${sectionName}\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:experience|education|skills|projects|awards|certifications|volunteer|references|contact)\\s*:?\\s*\\n|$)`,
        'i'
      );
      
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Parse date string to standardized format
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle various date formats
    const cleanDate = dateStr.trim().toLowerCase();
    
    if (cleanDate.includes('present') || cleanDate.includes('current')) {
      return null;
    }

    // Try to extract year
    const yearMatch = cleanDate.match(/(\d{4})/);
    if (yearMatch) {
      return yearMatch[1];
    }

    return cleanDate;
  }
}

// Export singleton instance
const resumeParsingService = new ResumeParsingService();

module.exports = {
  parseResumeContent: (filePath, mimeType) => resumeParsingService.parseResumeContent(filePath, mimeType),
  ResumeParsingService
};
