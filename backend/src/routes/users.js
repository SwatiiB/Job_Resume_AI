const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getProfileCompletion,
  updatePreferences,
  deactivateAccount,
  getAllUsers,
  getUserById,
  updateUserRole,
  searchUsers
} = require('../controllers/users');
const { protect, authorize, ownerOrAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { upload } = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         avatar:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         experience:
 *           type: array
 *           items:
 *             type: object
 *         education:
 *           type: array
 *           items:
 *             type: object
 *         certifications:
 *           type: array
 *           items:
 *             type: object
 *         location:
 *           type: object
 *         preferences:
 *           type: object
 */

// Validation rules
const profileUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('skills.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be between 1 and 50 characters')
];

const preferencesUpdateValidation = [
  body('jobTypes')
    .optional()
    .isArray()
    .withMessage('Job types must be an array'),
  body('jobTypes.*')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance'])
    .withMessage('Invalid job type'),
  body('workModes')
    .optional()
    .isArray()
    .withMessage('Work modes must be an array'),
  body('workModes.*')
    .optional()
    .isIn(['remote', 'hybrid', 'onsite'])
    .withMessage('Invalid work mode'),
  body('expectedSalary.min')
    .optional()
    .isNumeric()
    .withMessage('Expected salary minimum must be a number'),
  body('expectedSalary.max')
    .optional()
    .isNumeric()
    .withMessage('Expected salary maximum must be a number'),
  body('willingToRelocate')
    .optional()
    .isBoolean()
    .withMessage('Willing to relocate must be a boolean')
];

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 profile:
 *                   $ref: '#/components/schemas/UserProfile'
 */
router.get('/profile', protect, getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfile'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', protect, profileUpdateValidation, validate, updateProfile);

/**
 * @swagger
 * /api/users/profile/completion:
 *   get:
 *     summary: Get profile completion percentage
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile completion retrieved successfully
 */
router.get('/profile/completion', protect, getProfileCompletion);

/**
 * @swagger
 * /api/users/preferences:
 *   put:
 *     summary: Update user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               workModes:
 *                 type: array
 *                 items:
 *                   type: string
 *               expectedSalary:
 *                 type: object
 *               willingToRelocate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
router.put('/preferences', protect, preferencesUpdateValidation, validate, updatePreferences);

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

/**
 * @swagger
 * /api/users/avatar:
 *   delete:
 *     summary: Delete user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 */
router.delete('/avatar', protect, deleteAvatar);

/**
 * @swagger
 * /api/users/deactivate:
 *   put:
 *     summary: Deactivate user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 */
router.put('/deactivate', protect, deactivateAccount);

// Admin routes
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/', protect, authorize('admin'), getAllUsers);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users (Admin/Recruiter)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Filter by skills
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', protect, authorize('admin', 'recruiter'), searchUsers);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 */
router.get('/:userId', protect, ownerOrAdmin(), getUserById);

/**
 * @swagger
 * /api/users/{userId}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [candidate, recruiter, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.put('/:userId/role', protect, authorize('admin'), [
  body('role')
    .isIn(['candidate', 'recruiter', 'admin'])
    .withMessage('Invalid role')
], validate, updateUserRole);

module.exports = router;
