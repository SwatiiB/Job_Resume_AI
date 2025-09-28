const { GeminiService, MatchingService, ResumeAIService } = require('../ai-services');

// Mock dependencies
jest.mock('@google/generative-ai');
jest.mock('../src/utils/logger');

describe('AI Services', () => {
  describe('GeminiService', () => {
    let geminiService;

    beforeEach(() => {
      // Mock environment variables
      process.env.GEMINI_API_KEY = 'test-api-key';
      process.env.GEMINI_MODEL = 'gemini-pro';
      process.env.GEMINI_EMBEDDING_MODEL = 'embedding-001';

      // Create service instance with mocked API
      geminiService = new GeminiService();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('generateEmbedding', () => {
      it('should generate embedding for valid text', async () => {
        const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
        
        // Mock the Gemini API response
        const mockModel = {
          embedContent: jest.fn().mockResolvedValue({
            embedding: { values: mockEmbedding }
          })
        };

        geminiService.genAI = {
          getGenerativeModel: jest.fn().mockReturnValue(mockModel)
        };

        const result = await geminiService.generateEmbedding('Test resume content');

        expect(result).toEqual(mockEmbedding);
        expect(mockModel.embedContent).toHaveBeenCalledWith('Test resume content');
      });

      it('should throw error for empty text', async () => {
        await expect(geminiService.generateEmbedding('')).rejects.toThrow('Text is required for embedding generation');
      });

      it('should handle API errors gracefully', async () => {
        const mockModel = {
          embedContent: jest.fn().mockRejectedValue(new Error('API Error'))
        };

        geminiService.genAI = {
          getGenerativeModel: jest.fn().mockReturnValue(mockModel)
        };

        await expect(geminiService.generateEmbedding('Test text')).rejects.toThrow('Failed to generate embedding');
      });
    });

    describe('generateResumeSuggestions', () => {
      it('should generate resume suggestions', async () => {
        const mockResponse = {
          response: {
            text: () => JSON.stringify({
              suggestions: [
                {
                  type: 'content',
                  priority: 'high',
                  title: 'Add quantifiable achievements',
                  description: 'Include specific numbers and metrics'
                }
              ],
              missingSkills: ['JavaScript', 'Python'],
              atsScore: 85
            })
          }
        };

        geminiService.generativeModel = {
          generateContent: jest.fn().mockResolvedValue(mockResponse)
        };

        const result = await geminiService.generateResumeSuggestions('Resume content');

        expect(result.suggestions).toHaveLength(1);
        expect(result.suggestions[0].title).toBe('Add quantifiable achievements');
        expect(result.missingSkills).toContain('JavaScript');
        expect(result.atsScore).toBe(85);
      });

      it('should handle malformed API response', async () => {
        const mockResponse = {
          response: {
            text: () => 'Invalid JSON response'
          }
        };

        geminiService.generativeModel = {
          generateContent: jest.fn().mockResolvedValue(mockResponse)
        };

        const result = await geminiService.generateResumeSuggestions('Resume content');

        expect(result.suggestions).toEqual([]);
        expect(result.overallFeedback).toBe('Unable to parse AI response');
      });
    });

    describe('executeWithRetry', () => {
      it('should retry on retryable errors', async () => {
        let callCount = 0;
        const mockFunction = jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount < 3) {
            throw new Error('RATE_LIMIT_EXCEEDED');
          }
          return 'success';
        });

        const result = await geminiService.executeWithRetry(mockFunction);

        expect(result).toBe('success');
        expect(mockFunction).toHaveBeenCalledTimes(3);
      });

      it('should not retry on non-retryable errors', async () => {
        const mockFunction = jest.fn().mockRejectedValue(new Error('Invalid API key'));

        await expect(geminiService.executeWithRetry(mockFunction)).rejects.toThrow('Invalid API key');
        expect(mockFunction).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('MatchingService', () => {
    let matchingService;

    beforeEach(() => {
      matchingService = new MatchingService();
    });

    describe('calculateSemanticSimilarity', () => {
      it('should calculate cosine similarity correctly', () => {
        const embedding1 = [1, 0, 0];
        const embedding2 = [1, 0, 0];

        const similarity = matchingService.calculateSemanticSimilarity(embedding1, embedding2);

        expect(similarity).toBe(100); // Perfect match
      });

      it('should return 0 for mismatched embedding lengths', () => {
        const embedding1 = [1, 0, 0];
        const embedding2 = [1, 0];

        const similarity = matchingService.calculateSemanticSimilarity(embedding1, embedding2);

        expect(similarity).toBe(0);
      });

      it('should handle null embeddings', () => {
        const similarity = matchingService.calculateSemanticSimilarity(null, [1, 0, 0]);

        expect(similarity).toBe(0);
      });
    });

    describe('calculateSkillsMatch', () => {
      it('should calculate skills match percentage', () => {
        const mockResume = {
          extractedSkills: [
            { skill: 'JavaScript' },
            { skill: 'Python' },
            { skill: 'React' }
          ],
          parsedContent: {
            skills: {
              technical: ['Node.js', 'MongoDB']
            }
          }
        };

        const mockJob = {
          skills: ['JavaScript', 'Python', 'React', 'Angular']
        };

        const skillsScore = matchingService.calculateSkillsMatch(mockResume, mockJob);

        expect(skillsScore).toBeGreaterThan(0);
        expect(skillsScore).toBeLessThanOrEqual(100);
      });

      it('should return 0 when no skills match', () => {
        const mockResume = {
          extractedSkills: [{ skill: 'PHP' }],
          parsedContent: { skills: { technical: ['Laravel'] } }
        };

        const mockJob = {
          skills: ['JavaScript', 'Python']
        };

        const skillsScore = matchingService.calculateSkillsMatch(mockResume, mockJob);

        expect(skillsScore).toBe(0);
      });
    });

    describe('calculateExperienceMatch', () => {
      it('should calculate experience match for sufficient experience', () => {
        const mockResume = {
          parsedContent: {
            experience: [
              {
                startDate: '2020',
                endDate: '2023',
                current: false
              },
              {
                startDate: '2018',
                endDate: '2020',
                current: false
              }
            ]
          }
        };

        const mockJob = {
          experienceLevel: 'mid',
          description: 'Minimum 3 years of experience required'
        };

        const experienceScore = matchingService.calculateExperienceMatch(mockResume, mockJob);

        expect(experienceScore).toBeGreaterThan(80);
      });

      it('should handle missing experience gracefully', () => {
        const mockResume = {
          parsedContent: {
            experience: []
          }
        };

        const mockJob = {
          experienceLevel: 'entry'
        };

        const experienceScore = matchingService.calculateExperienceMatch(mockResume, mockJob);

        expect(experienceScore).toBeGreaterThan(0);
      });
    });

    describe('buildResumeEmbeddingContent', () => {
      it('should build comprehensive content for embedding', () => {
        const mockResume = {
          parsedContent: {
            personalInfo: {
              summary: 'Experienced software developer'
            },
            experience: [
              {
                position: 'Software Engineer',
                company: 'Tech Corp',
                description: 'Developed web applications'
              }
            ],
            skills: {
              technical: ['JavaScript', 'Python']
            },
            education: [
              {
                degree: 'Bachelor of Science',
                institution: 'University of Technology'
              }
            ]
          }
        };

        const content = matchingService.buildResumeEmbeddingContent(mockResume);

        expect(content).toContain('Summary: Experienced software developer');
        expect(content).toContain('Software Engineer at Tech Corp');
        expect(content).toContain('Technical Skills: JavaScript, Python');
        expect(content).toContain('Bachelor of Science from University of Technology');
      });

      it('should handle missing sections gracefully', () => {
        const mockResume = {
          parsedContent: {
            personalInfo: {
              summary: 'Brief summary'
            }
          }
        };

        const content = matchingService.buildResumeEmbeddingContent(mockResume);

        expect(content).toBe('Summary: Brief summary');
      });
    });
  });

  describe('ResumeAIService', () => {
    let resumeAIService;

    beforeEach(() => {
      resumeAIService = new ResumeAIService();
    });

    describe('calculateOverallScore', () => {
      it('should calculate weighted overall score', () => {
        const contentAnalysis = {
          contentQuality: { score: 80 }
        };

        const atsAnalysis = {
          score: 90
        };

        const overallScore = resumeAIService.calculateOverallScore(contentAnalysis, atsAnalysis);

        expect(overallScore).toBe(84); // (80 * 0.6) + (90 * 0.4) = 84
      });

      it('should handle missing scores', () => {
        const contentAnalysis = {};
        const atsAnalysis = {};

        const overallScore = resumeAIService.calculateOverallScore(contentAnalysis, atsAnalysis);

        expect(overallScore).toBe(0);
      });
    });

    describe('calculateWordCount', () => {
      it('should count words correctly', () => {
        const text = 'This is a test resume with multiple words';
        const wordCount = resumeAIService.calculateWordCount(text);

        expect(wordCount).toBe(9);
      });

      it('should handle empty text', () => {
        const wordCount = resumeAIService.calculateWordCount('');

        expect(wordCount).toBe(0);
      });

      it('should handle null text', () => {
        const wordCount = resumeAIService.calculateWordCount(null);

        expect(wordCount).toBe(0);
      });
    });

    describe('calculateReadabilityScore', () => {
      it('should give high score for optimal sentence length', () => {
        const text = 'This is a good sentence. Here is another one. Both are readable.';
        const score = resumeAIService.calculateReadabilityScore(text);

        expect(score).toBeGreaterThanOrEqual(75);
      });

      it('should give lower score for very long sentences', () => {
        const text = 'This is an extremely long sentence that goes on and on without any breaks or pauses and would be difficult for most people to read and understand easily.';
        const score = resumeAIService.calculateReadabilityScore(text);

        expect(score).toBeLessThan(75);
      });
    });

    describe('analyzeStructure', () => {
      it('should give high score for complete resume', () => {
        const mockResume = {
          parsedContent: {
            personalInfo: {
              name: 'John Doe',
              email: 'john@example.com'
            },
            experience: [{ position: 'Developer' }],
            education: [{ degree: 'BS' }],
            skills: {
              technical: ['JavaScript']
            }
          }
        };

        const score = resumeAIService.analyzeStructure(mockResume);

        expect(score).toBe(100);
      });

      it('should give lower score for incomplete resume', () => {
        const mockResume = {
          parsedContent: {
            personalInfo: {
              name: 'John Doe'
            }
          }
        };

        const score = resumeAIService.analyzeStructure(mockResume);

        expect(score).toBeLessThan(50);
      });
    });

    describe('extractResumeSkills', () => {
      it('should extract skills from multiple sources', () => {
        const mockResume = {
          extractedSkills: [
            { skill: 'JavaScript' },
            { skill: 'Python' }
          ],
          parsedContent: {
            skills: {
              technical: ['React', 'Node.js'],
              soft: ['Leadership']
            }
          }
        };

        const skills = resumeAIService.extractResumeSkills(mockResume);

        expect(skills).toContain('JavaScript');
        expect(skills).toContain('React');
        expect(skills).toContain('Leadership');
        expect(skills.length).toBeGreaterThan(3);
      });

      it('should handle missing skills sections', () => {
        const mockResume = {
          extractedSkills: [],
          parsedContent: {}
        };

        const skills = resumeAIService.extractResumeSkills(mockResume);

        expect(skills).toEqual([]);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work together for end-to-end matching', async () => {
      const mockResume = {
        _id: 'resume123',
        embedding: [0.1, 0.2, 0.3],
        extractedSkills: [{ skill: 'JavaScript' }],
        parsedContent: {
          experience: [
            {
              startDate: '2020',
              endDate: '2023'
            }
          ]
        },
        keywords: ['developer', 'javascript']
      };

      const mockJob = {
        _id: 'job123',
        embedding: [0.1, 0.2, 0.3],
        skills: ['JavaScript', 'React'],
        experienceLevel: 'mid',
        description: 'Looking for a developer with 3+ years experience'
      };

      const matchingService = new MatchingService();
      const result = await matchingService.calculateMatchScore(mockResume, mockJob);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.breakdown).toHaveProperty('semantic');
      expect(result.breakdown).toHaveProperty('skills');
      expect(result.breakdown).toHaveProperty('experience');
      expect(result.breakdown).toHaveProperty('keywords');
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const geminiService = new GeminiService();
      
      // Mock timeout
      geminiService.timeout = 100; // 100ms timeout
      
      const slowFunction = () => new Promise(resolve => setTimeout(resolve, 200));

      await expect(geminiService.executeWithRetry(slowFunction)).rejects.toThrow('Request timeout');
    });

    it('should handle malformed responses gracefully', () => {
      const geminiService = new GeminiService();
      
      const result = geminiService.parseResumeSuggestions('Not a JSON response');

      expect(result.suggestions).toEqual([]);
      expect(result.overallFeedback).toBe('Unable to parse AI response');
    });

    it('should handle missing data gracefully', () => {
      const matchingService = new MatchingService();
      
      const result = matchingService.calculateSkillsMatch({}, {});

      expect(result).toBe(0);
    });
  });
});

// Test utilities
describe('Test Utilities', () => {
  const createMockResume = (overrides = {}) => ({
    _id: 'resume123',
    userId: 'user123',
    embedding: [0.1, 0.2, 0.3],
    parsedContent: {
      personalInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        summary: 'Experienced developer'
      },
      experience: [
        {
          position: 'Software Engineer',
          company: 'Tech Corp',
          startDate: '2020',
          endDate: '2023',
          description: 'Developed web applications'
        }
      ],
      skills: {
        technical: ['JavaScript', 'Python', 'React']
      },
      education: [
        {
          degree: 'Bachelor of Science',
          institution: 'University of Technology'
        }
      ]
    },
    extractedSkills: [
      { skill: 'JavaScript', confidence: 0.9 },
      { skill: 'Python', confidence: 0.8 }
    ],
    keywords: ['developer', 'javascript', 'python'],
    atsScore: 85,
    ...overrides
  });

  const createMockJob = (overrides = {}) => ({
    _id: 'job123',
    title: 'Senior Software Engineer',
    company: {
      name: 'Tech Company'
    },
    description: 'Looking for an experienced software engineer',
    requirements: ['3+ years experience', 'JavaScript proficiency'],
    skills: ['JavaScript', 'React', 'Node.js'],
    experienceLevel: 'senior',
    embedding: [0.1, 0.2, 0.3],
    ...overrides
  });

  it('should create valid mock resume', () => {
    const resume = createMockResume();

    expect(resume._id).toBe('resume123');
    expect(resume.parsedContent.personalInfo.name).toBe('John Doe');
    expect(resume.extractedSkills).toHaveLength(2);
  });

  it('should create valid mock job', () => {
    const job = createMockJob();

    expect(job._id).toBe('job123');
    expect(job.title).toBe('Senior Software Engineer');
    expect(job.skills).toContain('JavaScript');
  });

  it('should allow overrides', () => {
    const resume = createMockResume({ atsScore: 95 });

    expect(resume.atsScore).toBe(95);
  });
});

// Performance tests
describe('Performance Tests', () => {
  it('should handle large embedding arrays efficiently', () => {
    const largeEmbedding1 = new Array(1000).fill(0).map(() => Math.random());
    const largeEmbedding2 = new Array(1000).fill(0).map(() => Math.random());

    const matchingService = new MatchingService();
    const startTime = Date.now();
    
    const similarity = matchingService.calculateSemanticSimilarity(largeEmbedding1, largeEmbedding2);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    expect(similarity).toBeGreaterThanOrEqual(0);
    expect(similarity).toBeLessThanOrEqual(100);
    expect(executionTime).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should handle batch operations efficiently', async () => {
    const geminiService = new GeminiService();
    
    // Mock batch embedding generation
    geminiService.generateEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);

    const texts = new Array(10).fill('test text');
    const startTime = Date.now();
    
    const embeddings = await geminiService.generateEmbeddingsBatch(texts);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    expect(embeddings).toHaveLength(10);
    expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
  });
});

module.exports = {
  createMockResume: (overrides = {}) => ({
    _id: 'resume123',
    userId: 'user123',
    embedding: [0.1, 0.2, 0.3],
    parsedContent: {
      personalInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        summary: 'Experienced developer'
      },
      experience: [
        {
          position: 'Software Engineer',
          company: 'Tech Corp',
          startDate: '2020',
          endDate: '2023'
        }
      ],
      skills: {
        technical: ['JavaScript', 'Python']
      }
    },
    extractedSkills: [
      { skill: 'JavaScript', confidence: 0.9 }
    ],
    keywords: ['developer', 'javascript'],
    atsScore: 85,
    ...overrides
  }),

  createMockJob: (overrides = {}) => ({
    _id: 'job123',
    title: 'Software Engineer',
    company: { name: 'Tech Company' },
    description: 'Looking for a software engineer',
    skills: ['JavaScript', 'React'],
    experienceLevel: 'mid',
    embedding: [0.1, 0.2, 0.3],
    ...overrides
  })
};
