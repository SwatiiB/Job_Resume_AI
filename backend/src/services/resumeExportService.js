const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Resume Export Service
 * Handles exporting resumes to different formats (PDF, DOCX, TXT, JSON)
 */
class ResumeExportService {
  constructor() {
    this.supportedFormats = ['pdf', 'docx', 'txt', 'json'];
    this.exportDir = path.join(__dirname, '../../exports');
    
    // Ensure export directory exists
    this.ensureExportDirectory();
  }

  /**
   * Export resume to specified format
   */
  async exportResumeToFormat(resume, format) {
    try {
      if (!this.supportedFormats.includes(format)) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      switch (format) {
        case 'json':
          return await this.exportToJSON(resume);
        case 'txt':
          return await this.exportToTXT(resume);
        case 'pdf':
          return await this.exportToPDF(resume);
        case 'docx':
          return await this.exportToDOCX(resume);
        default:
          throw new Error(`Export format ${format} not implemented`);
      }

    } catch (error) {
      logger.error(`Resume export error (${format}):`, error);
      throw error;
    }
  }

  /**
   * Export resume to JSON format
   */
  async exportToJSON(resume) {
    try {
      const exportData = {
        metadata: {
          originalName: resume.originalName,
          exportedAt: new Date().toISOString(),
          version: resume.version,
          atsScore: resume.atsScore,
          format: 'json'
        },
        personalInfo: resume.parsedContent?.personalInfo || {},
        experience: resume.parsedContent?.experience || [],
        education: resume.parsedContent?.education || [],
        skills: resume.parsedContent?.skills || {},
        projects: resume.parsedContent?.projects || [],
        awards: resume.parsedContent?.awards || [],
        publications: resume.parsedContent?.publications || [],
        volunteering: resume.parsedContent?.volunteering || [],
        extractedSkills: resume.extractedSkills || [],
        keywords: resume.keywords || [],
        aiSuggestions: resume.aiSuggestions || []
      };

      const filename = `resume_${resume.userId}_${Date.now()}.json`;
      const filePath = path.join(this.exportDir, filename);
      
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));

      return {
        format: 'json',
        filename,
        filePath,
        downloadUrl: `/api/exports/${filename}`,
        size: (await fs.stat(filePath)).size
      };

    } catch (error) {
      logger.error('JSON export error:', error);
      throw new Error('Failed to export resume as JSON');
    }
  }

  /**
   * Export resume to plain text format
   */
  async exportToTXT(resume) {
    try {
      const { parsedContent } = resume;
      
      if (!parsedContent) {
        throw new Error('Resume content not available for export');
      }

      let textContent = '';

      // Header with personal information
      if (parsedContent.personalInfo) {
        const info = parsedContent.personalInfo;
        if (info.name) textContent += `${info.name}\n`;
        if (info.email) textContent += `Email: ${info.email}\n`;
        if (info.phone) textContent += `Phone: ${info.phone}\n`;
        if (info.address) textContent += `Address: ${info.address}\n`;
        if (info.linkedin) textContent += `LinkedIn: ${info.linkedin}\n`;
        if (info.github) textContent += `GitHub: ${info.github}\n`;
        if (info.website) textContent += `Website: ${info.website}\n`;
        textContent += '\n';

        // Professional summary
        if (info.summary) {
          textContent += 'PROFESSIONAL SUMMARY\n';
          textContent += '===================\n';
          textContent += `${info.summary}\n\n`;
        }
      }

      // Work Experience
      if (parsedContent.experience && parsedContent.experience.length > 0) {
        textContent += 'WORK EXPERIENCE\n';
        textContent += '===============\n';
        
        parsedContent.experience.forEach(exp => {
          if (exp.position) textContent += `${exp.position}`;
          if (exp.company) textContent += ` at ${exp.company}`;
          textContent += '\n';
          
          if (exp.startDate || exp.endDate) {
            textContent += `${exp.startDate || 'Unknown'} - ${exp.endDate || (exp.current ? 'Present' : 'Unknown')}\n`;
          }
          
          if (exp.location) textContent += `Location: ${exp.location}\n`;
          
          if (exp.description) {
            textContent += `${exp.description}\n`;
          }
          
          if (exp.achievements && exp.achievements.length > 0) {
            textContent += 'Key Achievements:\n';
            exp.achievements.forEach(achievement => {
              textContent += `• ${achievement}\n`;
            });
          }
          
          if (exp.technologies && exp.technologies.length > 0) {
            textContent += `Technologies: ${exp.technologies.join(', ')}\n`;
          }
          
          textContent += '\n';
        });
      }

      // Education
      if (parsedContent.education && parsedContent.education.length > 0) {
        textContent += 'EDUCATION\n';
        textContent += '=========\n';
        
        parsedContent.education.forEach(edu => {
          if (edu.degree) textContent += `${edu.degree}`;
          if (edu.field) textContent += ` in ${edu.field}`;
          textContent += '\n';
          
          if (edu.institution) textContent += `${edu.institution}\n`;
          
          if (edu.startDate || edu.endDate) {
            textContent += `${edu.startDate || 'Unknown'} - ${edu.endDate || (edu.current ? 'Present' : 'Unknown')}\n`;
          }
          
          if (edu.gpa) textContent += `GPA: ${edu.gpa}\n`;
          if (edu.description) textContent += `${edu.description}\n`;
          
          textContent += '\n';
        });
      }

      // Skills
      if (parsedContent.skills) {
        textContent += 'SKILLS\n';
        textContent += '======\n';
        
        if (parsedContent.skills.technical && parsedContent.skills.technical.length > 0) {
          textContent += `Technical Skills: ${parsedContent.skills.technical.join(', ')}\n`;
        }
        
        if (parsedContent.skills.soft && parsedContent.skills.soft.length > 0) {
          textContent += `Soft Skills: ${parsedContent.skills.soft.join(', ')}\n`;
        }
        
        if (parsedContent.skills.languages && parsedContent.skills.languages.length > 0) {
          textContent += 'Languages:\n';
          parsedContent.skills.languages.forEach(lang => {
            textContent += `• ${lang.language}${lang.proficiency ? ` (${lang.proficiency})` : ''}\n`;
          });
        }
        
        if (parsedContent.skills.certifications && parsedContent.skills.certifications.length > 0) {
          textContent += 'Certifications:\n';
          parsedContent.skills.certifications.forEach(cert => {
            textContent += `• ${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}\n`;
          });
        }
        
        textContent += '\n';
      }

      // Projects
      if (parsedContent.projects && parsedContent.projects.length > 0) {
        textContent += 'PROJECTS\n';
        textContent += '========\n';
        
        parsedContent.projects.forEach(project => {
          if (project.name) textContent += `${project.name}\n`;
          if (project.description) textContent += `${project.description}\n`;
          if (project.technologies && project.technologies.length > 0) {
            textContent += `Technologies: ${project.technologies.join(', ')}\n`;
          }
          if (project.url) textContent += `URL: ${project.url}\n`;
          if (project.github) textContent += `GitHub: ${project.github}\n`;
          textContent += '\n';
        });
      }

      // Awards
      if (parsedContent.awards && parsedContent.awards.length > 0) {
        textContent += 'AWARDS & RECOGNITION\n';
        textContent += '===================\n';
        
        parsedContent.awards.forEach(award => {
          if (award.title) textContent += `${award.title}`;
          if (award.issuer) textContent += ` - ${award.issuer}`;
          if (award.date) textContent += ` (${award.date})`;
          textContent += '\n';
          if (award.description) textContent += `${award.description}\n`;
          textContent += '\n';
        });
      }

      // Publications
      if (parsedContent.publications && parsedContent.publications.length > 0) {
        textContent += 'PUBLICATIONS\n';
        textContent += '============\n';
        
        parsedContent.publications.forEach(pub => {
          if (pub.title) textContent += `${pub.title}`;
          if (pub.publisher) textContent += ` - ${pub.publisher}`;
          if (pub.date) textContent += ` (${pub.date})`;
          textContent += '\n';
          if (pub.url) textContent += `URL: ${pub.url}\n`;
          if (pub.description) textContent += `${pub.description}\n`;
          textContent += '\n';
        });
      }

      // Volunteer Experience
      if (parsedContent.volunteering && parsedContent.volunteering.length > 0) {
        textContent += 'VOLUNTEER EXPERIENCE\n';
        textContent += '====================\n';
        
        parsedContent.volunteering.forEach(vol => {
          if (vol.role) textContent += `${vol.role}`;
          if (vol.organization) textContent += ` at ${vol.organization}`;
          textContent += '\n';
          
          if (vol.startDate || vol.endDate) {
            textContent += `${vol.startDate || 'Unknown'} - ${vol.endDate || (vol.current ? 'Present' : 'Unknown')}\n`;
          }
          
          if (vol.description) textContent += `${vol.description}\n`;
          textContent += '\n';
        });
      }

      const filename = `resume_${resume.userId}_${Date.now()}.txt`;
      const filePath = path.join(this.exportDir, filename);
      
      await fs.writeFile(filePath, textContent);

      return {
        format: 'txt',
        filename,
        filePath,
        downloadUrl: `/api/exports/${filename}`,
        size: (await fs.stat(filePath)).size
      };

    } catch (error) {
      logger.error('TXT export error:', error);
      throw new Error('Failed to export resume as TXT');
    }
  }

  /**
   * Export resume to PDF format (ATS-friendly)
   * Note: This is a placeholder implementation. In a real application,
   * you would use a library like Puppeteer, PDFKit, or jsPDF
   */
  async exportToPDF(resume) {
    try {
      // For now, we'll create a simple HTML version and note that PDF generation
      // would require additional libraries like Puppeteer
      const htmlContent = await this.generateHTMLContent(resume);
      
      const filename = `resume_${resume.userId}_${Date.now()}.html`;
      const filePath = path.join(this.exportDir, filename);
      
      await fs.writeFile(filePath, htmlContent);

      // In a real implementation, you would convert HTML to PDF here
      logger.warn('PDF export is currently generating HTML. Implement PDF conversion with Puppeteer or similar.');

      return {
        format: 'html', // Would be 'pdf' in real implementation
        filename,
        filePath,
        downloadUrl: `/api/exports/${filename}`,
        size: (await fs.stat(filePath)).size,
        note: 'PDF export requires additional setup. Currently generating HTML version.'
      };

    } catch (error) {
      logger.error('PDF export error:', error);
      throw new Error('Failed to export resume as PDF');
    }
  }

  /**
   * Export resume to DOCX format
   * Note: This is a placeholder implementation. In a real application,
   * you would use a library like docx or officegen
   */
  async exportToDOCX(resume) {
    try {
      // For now, we'll use the TXT export as a base
      const txtResult = await this.exportToTXT(resume);
      
      const filename = `resume_${resume.userId}_${Date.now()}.docx`;
      const filePath = path.join(this.exportDir, filename);
      
      // In a real implementation, you would use a DOCX library here
      // For now, we'll just copy the TXT content
      await fs.copyFile(txtResult.filePath, filePath);
      
      logger.warn('DOCX export is currently generating TXT. Implement DOCX conversion with docx library.');

      return {
        format: 'txt', // Would be 'docx' in real implementation
        filename,
        filePath,
        downloadUrl: `/api/exports/${filename}`,
        size: (await fs.stat(filePath)).size,
        note: 'DOCX export requires additional setup. Currently generating TXT version.'
      };

    } catch (error) {
      logger.error('DOCX export error:', error);
      throw new Error('Failed to export resume as DOCX');
    }
  }

  /**
   * Generate HTML content for PDF conversion
   */
  async generateHTMLContent(resume) {
    const { parsedContent } = resume;
    
    if (!parsedContent) {
      throw new Error('Resume content not available for HTML generation');
    }

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${parsedContent.personalInfo?.name || 'Unknown'}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .contact-info {
            font-size: 14px;
            color: #666;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            border-bottom: 1px solid #ccc;
            margin-bottom: 15px;
            padding-bottom: 5px;
        }
        .job, .education-item, .project {
            margin-bottom: 20px;
        }
        .job-title, .degree {
            font-weight: bold;
            font-size: 16px;
        }
        .company, .school {
            font-style: italic;
            color: #666;
        }
        .dates {
            color: #888;
            font-size: 14px;
        }
        .description {
            margin-top: 8px;
        }
        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .skill-tag {
            background: #f0f0f0;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
        }
        ul {
            margin: 8px 0;
            padding-left: 20px;
        }
        li {
            margin-bottom: 4px;
        }
    </style>
</head>
<body>`;

    // Header
    if (parsedContent.personalInfo) {
      const info = parsedContent.personalInfo;
      html += `
    <div class="header">
        <div class="name">${info.name || 'Resume'}</div>
        <div class="contact-info">`;
        
        const contactItems = [];
        if (info.email) contactItems.push(info.email);
        if (info.phone) contactItems.push(info.phone);
        if (info.address) contactItems.push(info.address);
        if (info.linkedin) contactItems.push(info.linkedin);
        
        html += contactItems.join(' • ');
        html += `
        </div>
    </div>`;

      // Professional Summary
      if (info.summary) {
        html += `
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <p>${info.summary}</p>
    </div>`;
      }
    }

    // Work Experience
    if (parsedContent.experience && parsedContent.experience.length > 0) {
      html += `
    <div class="section">
        <div class="section-title">Work Experience</div>`;
        
      parsedContent.experience.forEach(exp => {
        html += `
        <div class="job">
            <div class="job-title">${exp.position || 'Position'}</div>
            <div class="company">${exp.company || 'Company'}</div>
            <div class="dates">${exp.startDate || ''} - ${exp.endDate || (exp.current ? 'Present' : '')}</div>
            ${exp.location ? `<div class="location">${exp.location}</div>` : ''}
            ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
        </div>`;
      });
      
      html += `
    </div>`;
    }

    // Education
    if (parsedContent.education && parsedContent.education.length > 0) {
      html += `
    <div class="section">
        <div class="section-title">Education</div>`;
        
      parsedContent.education.forEach(edu => {
        html += `
        <div class="education-item">
            <div class="degree">${edu.degree || 'Degree'}</div>
            <div class="school">${edu.institution || 'Institution'}</div>
            <div class="dates">${edu.startDate || ''} - ${edu.endDate || (edu.current ? 'Present' : '')}</div>
            ${edu.gpa ? `<div class="gpa">GPA: ${edu.gpa}</div>` : ''}
        </div>`;
      });
      
      html += `
    </div>`;
    }

    // Skills
    if (parsedContent.skills && parsedContent.skills.technical && parsedContent.skills.technical.length > 0) {
      html += `
    <div class="section">
        <div class="section-title">Technical Skills</div>
        <div class="skills-list">`;
        
      parsedContent.skills.technical.forEach(skill => {
        html += `<span class="skill-tag">${skill}</span>`;
      });
      
      html += `
        </div>
    </div>`;
    }

    html += `
</body>
</html>`;

    return html;
  }

  /**
   * Ensure export directory exists
   */
  async ensureExportDirectory() {
    try {
      await fs.access(this.exportDir);
    } catch (error) {
      await fs.mkdir(this.exportDir, { recursive: true });
      logger.info(`Created export directory: ${this.exportDir}`);
    }
  }

  /**
   * Clean up old export files
   */
  async cleanupOldExports(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.exportDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          logger.info(`Cleaned up old export file: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Error cleaning up old exports:', error);
    }
  }
}

// Export singleton instance
const resumeExportService = new ResumeExportService();

// Clean up old exports on startup
resumeExportService.cleanupOldExports();

module.exports = {
  exportResumeToFormat: (resume, format) => resumeExportService.exportResumeToFormat(resume, format),
  ResumeExportService
};
