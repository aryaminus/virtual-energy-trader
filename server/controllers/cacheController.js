import { getDataCache } from '../config/services.js';
// For Netlify Functions, import from netlify services
import { getNetlifyDataCache } from '../config/netlifyServices.js';
import { logger } from '../utils/logger.js';

/**
 * Get cache statistics
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const getCacheStats = (req, res) => {
  // Use Netlify service getters if available, fallback to regular ones
  const dataCache = getNetlifyDataCache() || getDataCache();
  
  const stats = {
    size: dataCache?.size() || 0,
    timestamp: new Date().toISOString(),
    status: 'operational'
  };
  
  logger.info(`📊 Cache stats requested: ${stats.size} items`);
  
  res.json(stats);
};

/**
 * Clear cache
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const clearCache = (req, res) => {
  // Use Netlify service getters if available, fallback to regular ones
  const dataCache = getNetlifyDataCache() || getDataCache();
  
  const previousSize = dataCache?.size() || 0;
  dataCache?.clear();
  
  logger.info(`🗑️  Cache cleared: ${previousSize} items removed`);
  
  res.json({
    success: true,
    message: 'Cache cleared',
    previousSize,
    timestamp: new Date().toISOString()
  });
};