const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware to protect routes - requires valid JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'No user found with this token'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User account is deactivated'
        });
      }

      // Check if user is verified (except for verification endpoints)
      if (!user.isVerified && !req.path.includes('verify')) {
        return res.status(401).json({
          success: false,
          error: 'Please verify your email address'
        });
      }

      // Add user to request object
      req.user = user;
      next();

    } catch (error) {
      logger.error('Token verification failed:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error in authentication'
    });
  }
};

/**
 * Middleware to authorize specific roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource or is admin
 */
const ownerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params.userId || req.body[resourceUserIdField] || req.user.id;
    
    if (req.user.id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }

    next();
  };
};

/**
 * Middleware to verify refresh token
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Check if refresh token exists in user's tokens
      const tokenExists = user.refreshTokens.some(tokenObj => tokenObj.token === refreshToken);

      if (!tokenExists) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User account is deactivated'
        });
      }

      req.user = user;
      req.refreshToken = refreshToken;
      next();

    } catch (error) {
      logger.error('Refresh token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

  } catch (error) {
    logger.error('Refresh token middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error in token verification'
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, continue without user
    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive) {
        req.user = user;
      }

    } catch (error) {
      // Continue without user if token is invalid
      logger.debug('Optional auth token verification failed:', error.message);
    }

    next();

  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};

/**
 * Rate limiting for sensitive operations
 */
const sensitiveOperationLimit = (maxAttempts = 3, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.user ? req.user.id : '');
    const now = Date.now();
    const userAttempts = attempts.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset counter if window has expired
    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + windowMs;
    }

    // Check if limit exceeded
    if (userAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((userAttempts.resetTime - now) / 1000 / 60);
      return res.status(429).json({
        success: false,
        error: `Too many attempts. Try again in ${timeLeft} minutes.`
      });
    }

    // Increment counter
    userAttempts.count++;
    attempts.set(key, userAttempts);

    next();
  };
};

module.exports = {
  protect,
  authorize,
  ownerOrAdmin,
  verifyRefreshToken,
  optionalAuth,
  sensitiveOperationLimit
};
