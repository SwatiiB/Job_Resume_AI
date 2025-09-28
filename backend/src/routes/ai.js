const express = require('express');
const { body } = require('express-validator');
const {
  getHealthStatus,
  generateTextEmbedding,
  matchResumeToJob,
  getJobRecommendations,
  getCandidateRecommendations,
  analyzeResumeWithAI,
  getResumeSuggestions,
  optimizeResumeForSpecificJob,
  extractSkills,
  optimizeJobDescriptionWithAI,
  bulkGenerateResumeEmbeddings,
  bulkGenerateJobEmbeddings
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const embeddingValidation = [
  body('text')
    .notEmpty()
    .isLength({ min: 10, max: 8000 })
    .withMessage('Text must be between 10 and 8000 characters')
];

const matchValidation = [
  body('resumeId')
    .isMongoId()
    .withMessage('Valid resume ID is required'),
  body('jobId')
    .isMongoId()
    .withMessage('Valid job ID is required')
];

const recommendationsValidation = [
  body('resumeId')
    .optional()
    .isMongoId()
    .withMessage('Valid resume ID is required'),
  body('jobId')
    .optional()
    .isMongoId()
    .withMessage('Valid job ID is required'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const analysisValidation = [
  body('resumeId')
    .isMongoId()
    .withMessage('Valid resume ID is required')
];

// Routes
router.get('/health', protect, authorize('admin'), getHealthStatus);
router.post('/embedding', protect, embeddingValidation, validate, generateTextEmbedding);
router.post('/match/resume-to-job', protect, matchValidation, validate, matchResumeToJob);
router.post('/match/job-recommendations', protect, authorize('candidate', 'admin'), recommendationsValidation, validate, getJobRecommendations);
router.post('/match/candidate-recommendations', protect, authorize('recruiter', 'admin'), recommendationsValidation, validate, getCandidateRecommendations);
router.post('/analyze/resume', protect, analysisValidation, validate, analyzeResumeWithAI);
router.post('/suggestions/resume', protect, analysisValidation, validate, getResumeSuggestions);
router.post('/optimize/resume-for-job', protect, matchValidation, validate, optimizeResumeForSpecificJob);
router.post('/extract/skills', protect, [
  body('resumeId').optional().isMongoId().withMessage('Valid resume ID required'),
  body('content').optional().isString().withMessage('Content must be a string')
], validate, extractSkills);
router.post('/optimize/job-description', protect, authorize('recruiter', 'admin'), [
  body('jobId').optional().isMongoId().withMessage('Valid job ID required'),
  body('description').optional().isString().withMessage('Description must be a string')
], validate, optimizeJobDescriptionWithAI);
router.post('/embeddings/resumes/bulk', protect, authorize('admin'), [
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validate, bulkGenerateResumeEmbeddings);
router.post('/embeddings/jobs/bulk', protect, authorize('admin'), [
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validate, bulkGenerateJobEmbeddings);

module.exports = router;