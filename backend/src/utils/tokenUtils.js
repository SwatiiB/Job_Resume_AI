const jwt = require('jsonwebtoken');

/**
 * Generate token response with both access and refresh tokens
 */
const generateTokenResponse = (user) => {
  const token = user.getSignedJwtToken();
  const refreshToken = user.generateRefreshToken();
  
  return {
    token,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRE || '15m'
  };
};

/**
 * Clear token cookie (for future cookie implementation)
 */
const clearTokenCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Decode JWT token without verification (for debugging)
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Invalid token format');
  }
};

/**
 * Check if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiry time
 */
const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Generate secure random token
 */
const generateSecureToken = (length = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  generateTokenResponse,
  clearTokenCookie,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiry,
  generateSecureToken
};
