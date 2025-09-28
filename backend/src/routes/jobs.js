const express = require('express');
const { body, query } = require('express-validator');
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
  searchJobs,
  getMyJobs,
  getMyApplications,
  getFeaturedJobs,
  getJobStats,
  scheduleInterview,
  addJobNote
} = require('../controllers/jobs');
const { protect, authorize, ownerOrAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     JobCreate:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *         - employmentType
 *       properties:
 *         title:
 *           type: string
 *           example: Senior Software Engineer
 *         company:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: Tech Corp Inc.
 *         description:
 *           type: string
 *           example: We are looking for a senior software engineer...
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         location:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *             workMode:
 *               type: string
 *               enum: [remote, hybrid, onsite]
 *         salary:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *         employmentType:
 *           type: string
 *           enum: [full-time, part-time, contract, internship, freelance]
 */

// Validation rules
const createJobValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Job title must be between 3 and 200 characters'),
  body('company.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50 and 5000 characters'),
  body('location.workMode')
    .isIn(['remote', 'hybrid', 'onsite'])
    .withMessage('Work mode must be remote, hybrid, or onsite'),
  body('employmentType')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance'])
    .withMessage('Invalid employment type'),
  body('experienceLevel')
    .optional()
    .isIn(['entry', 'mid', 'senior', 'lead', 'executive'])
    .withMessage('Invalid experience level'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('salary.min')
    .optional()
    .isNumeric()
    .withMessage('Minimum salary must be a number'),
  body('salary.max')
    .optional()
    .isNumeric()
    .withMessage('Maximum salary must be a number')
];

const updateJobValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Job title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50 and 5000 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'closed', 'expired'])
    .withMessage('Invalid job status')
];

const applyJobValidation = [
  body('coverLetter')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters')
];

const searchJobsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('salaryMin')
    .optional()
    .isNumeric()
    .withMessage('Minimum salary must be a number'),
  query('salaryMax')
    .optional()
    .isNumeric()
    .withMessage('Maximum salary must be a number')
];

// Routes
router.post('/', protect, authorize('recruiter', 'admin'), createJobValidation, validate, createJob);
router.get('/', getJobs);
router.get('/search', searchJobsValidation, validate, searchJobs);
router.get('/featured', getFeaturedJobs);
router.get('/my-jobs', protect, authorize('recruiter', 'admin'), getMyJobs);
router.get('/my-applications', protect, authorize('candidate'), getMyApplications);
router.get('/:jobId', getJobById);
router.put('/:jobId', protect, authorize('recruiter', 'admin'), updateJobValidation, validate, updateJob);
router.delete('/:jobId', protect, authorize('recruiter', 'admin'), deleteJob);
router.post('/:jobId/apply', protect, authorize('candidate'), applyJobValidation, validate, applyToJob);
router.get('/:jobId/applications', protect, authorize('recruiter', 'admin'), getJobApplications);
router.put('/:jobId/applications/:candidateId/status', 
  protect, 
  authorize('recruiter', 'admin'), 
  [
    body('status')
      .isIn(['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected'])
      .withMessage('Invalid application status')
  ], 
  validate, 
  updateApplicationStatus
);
router.get('/:jobId/stats', protect, authorize('recruiter', 'admin'), getJobStats);

module.exports = router;