import { getGridStatusClient, getDataCache } from '../config/services.js';
// For Netlify Functions, import from netlify services
import { getNetlifyGridStatusClient, getNetlifyDataCache } from '../config/netlifyServices.js';
import { logger } from '../utils/logger.js';

/**
 * Get system health status
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const getHealthStatus = (req, res) => {
  const gridStatusClient =  getNetlifyGridStatusClient() || getGridStatusClient();
  const dataCache =  getNetlifyDataCache() || getDataCache();
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      gridStatus: {
        configured: !!gridStatusClient,
        status: gridStatusClient ? 'available' : 'not-configured'
      },
      cache: {
        size: dataCache?.size() || 0,
        status: 'operational'
      },
      aiProviders: {
        google: !!process.env.GOOGLE_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        together: !!process.env.TOGETHER_API_KEY
      }
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };
  
  logger.info('🏥 Health check requested');
  
  res.json(healthData);
};