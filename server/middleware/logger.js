import { logger } from '../utils/logger.js';

/**
 * Request logging middleware
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info(`📥 ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length') || 0
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.info(`📤 ${req.method} ${req.url} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    });
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};