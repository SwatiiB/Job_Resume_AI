const express = require('express');
const { body, query } = require('express-validator');
const {
  uploadResume,
  getMyResumes,
  getResumeById,
  updateResume,
  deleteResume,
  downloadResume,
  parseResume,
  getResumeAnalysis,
  getAISuggestions,
  applySuggestion,
  exportResume,
  searchResumes,
  setActiveResume,
  getResumeVersions,
  compareResumes
} = require('../controllers/resumes');
const { protect, authorize, ownerOrAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { resumeUpload, handleMulterError, cleanupOnError } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const uploadValidation = [
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
];

const searchValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('minAtsScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Minimum ATS score must be between 0 and 100')
];

// Routes
router.post('/', 
  protect, 
  cleanupOnError, 
  resumeUpload.single('resume'), 
  handleMulterError, 
  uploadValidation, 
  validate, 
  uploadResume
);

router.get('/', protect, getMyResumes);
router.get('/search', protect, authorize('admin', 'recruiter'), searchValidation, validate, searchResumes);
router.get('/versions/:userId', protect, ownerOrAdmin(), getResumeVersions);
router.get('/compare/:resumeId1/:resumeId2', protect, compareResumes);

router.get('/:resumeId', protect, getResumeById);
router.put('/:resumeId', protect, [
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], validate, updateResume);

router.delete('/:resumeId', protect, deleteResume);
router.get('/:resumeId/download', protect, downloadResume);
router.post('/:resumeId/parse', protect, parseResume);
router.get('/:resumeId/analysis', protect, getResumeAnalysis);
router.get('/:resumeId/suggestions', protect, getAISuggestions);
router.post('/:resumeId/suggestions/:suggestionId/apply', protect, applySuggestion);
router.post('/:resumeId/export', protect, [
  body('format')
    .isIn(['pdf', 'docx', 'txt', 'json'])
    .withMessage('Invalid export format')
], validate, exportResume);
router.post('/:resumeId/set-active', protect, setActiveResume);

module.exports = router;