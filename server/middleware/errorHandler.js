import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details
  logger.error('❌ Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
      timestamp: new Date().toISOString()
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON format',
      details: 'Request body contains invalid JSON',
      timestamp: new Date().toISOString()
    });
  }

  // Handle rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      details: 'Rate limit exceeded. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const notFoundHandler = (req, res) => {
  logger.warn(`🔍 404 - Route not found: ${req.method} ${req.url}`);
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    details: `The requested endpoint ${req.method} ${req.url} does not exist`,
    timestamp: new Date().toISOString()
  });
};