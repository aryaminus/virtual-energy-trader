import { getMarketData, getAvailableDatasets } from "../../server/controllers/marketController.js";
import { simulateTrades } from "../../server/controllers/tradingController.js";
import { getAIProviders, analyzeSpikes, performAIAnalysis } from "../../server/controllers/analysisController.js";
import { getHealthStatus } from "../../server/controllers/healthController.js";
import { getCacheStats, clearCache } from "../../server/controllers/cacheController.js";

// Import services and utilities
import GridStatusClient from "../../server/services/gridstatus.js";
import DataCache from "../../server/services/dataCache.js";
import SpikeAnalyzer from "../../server/services/spikeAnalyzer.js";
import { setNetlifyServices } from "../../server/config/netlifyServices.js";
import { logger } from "../../server/utils/logger.js";
import { ApiError } from "../../server/utils/errors.js";

// Import middleware
import { 
  validateDateParam, 
  validateISOQuery, 
  validateTradeSimulation,
  validateSpikeAnalysis,
  validateAIAnalysis 
} from "../../server/middleware/validation.js";

// Initialize services
let gridStatusClient = null;
let dataCache = null;
let spikeAnalyzer = null;
let servicesInitialized = false;

const initializeServices = () => {
  if (servicesInitialized) return;
  
  try {
    logger.info('🔧 Initializing services for Netlify...');

    // Initialize GridStatus client
    if (Netlify.env.get('GRIDSTATUS_API_KEY')) {
      gridStatusClient = new GridStatusClient(Netlify.env.get('GRIDSTATUS_API_KEY'));
      logger.info('✅ GridStatus client initialized');
    } else {
      logger.warn('⚠️  GridStatus API key not configured');
    }

    // Initialize data cache
    dataCache = new DataCache(60); // 60-minute cache
    logger.info('✅ Data cache initialized');

    // Initialize spike analyzer
    spikeAnalyzer = new SpikeAnalyzer();
    logger.info('✅ Spike analyzer initialized');

    // Set services for controllers to use
    setNetlifyServices(gridStatusClient, dataCache, spikeAnalyzer);

    servicesInitialized = true;
    logger.info('🎉 All services initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    throw error;
  }
};

// Helper function to parse request body
const parseBody = async (request) => {
  if (!request.body) return {};
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    throw new ApiError('Invalid JSON in request body', 400);
  }
};

// Helper function to create response
const createResponse = (statusCode, body, headers = {}) => {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      ...headers,
    },
  });
};

// Route handler
const handleRoute = async (request, context) => {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  
  // Initialize services
  try {
    initializeServices();
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    return createResponse(500, {
      success: false,
      error: 'Service initialization failed',
      details: error.message
    });
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return createResponse(200, {});
  }

  // Parse the path - handle both direct function calls and redirected API calls
  let pathToProcess = pathname;
  
  // Remove function path prefix if present
  if (pathToProcess.startsWith('/.netlify/functions/api')) {
    pathToProcess = pathToProcess.replace('/.netlify/functions/api', '');
  }
  
  // Remove leading /api if present (from redirect)
  if (pathToProcess.startsWith('/api')) {
    pathToProcess = pathToProcess.replace('/api', '');
  }
  
  // Ensure we start with a clean path
  if (!pathToProcess.startsWith('/')) {
    pathToProcess = '/' + pathToProcess;
  }
  
  const pathParts = pathToProcess.split('/').filter(Boolean);
  const [resource, action, param] = pathParts;

  logger.info(`🔍 Processing route: ${method} ${pathname} -> ${pathToProcess} -> [${pathParts.join(', ')}]`);

  try {
    // Create mock request and response objects for existing controllers
    const req = {
      method,
      url: pathname,
      params: {},
      query: Object.fromEntries(url.searchParams),
      body: method !== 'GET' ? await parseBody(request) : {},
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      get: (header) => request.headers.get(header.toLowerCase()),
    };

    // Set params based on path
    if (action === 'data' && param) {
      req.params.date = param;
    } else if (action === 'spikes' && param) {
      req.params.date = param;
    }

    // Route handling with proper async/await
    switch (resource) {
      case '':
      case undefined:
        // Root API route
        return createResponse(200, {
          success: true,
          name: 'Virtual Energy Trader API',
          version: '1.0.0',
          status: 'running',
          platform: 'Netlify Functions',
          endpoints: {
            health: '/api/health',
            market: '/api/market',
            trading: '/api/trading',
            analysis: '/api/analysis',
            cache: '/api/cache'
          }
        });

      case 'health':
        try {
          // Create a promise-based response handler
          const result = await new Promise((resolve, reject) => {
            const res = {
              json: (data) => resolve(data)
            };
            getHealthStatus(req, res);
          });
          return createResponse(200, { success: true, ...result });
        } catch (error) {
          logger.error('❌ Health check error:', error);
          return createResponse(500, {
            success: false,
            error: 'Health check failed',
            details: error.message
          });
        }

      case 'market':
        if (action === 'data' && param) {
          // Validate date parameter
          if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) {
            return createResponse(400, {
              success: false,
              error: 'Invalid date format. Expected YYYY-MM-DD'
            });
          }
          
          try {
            const result = await new Promise((resolve, reject) => {
              const res = {
                json: (data) => resolve(data)
              };
              getMarketData(req, res, reject);
            });
            return createResponse(200, { success: true, ...result });
          } catch (error) {
            logger.error('❌ Market data error:', error);
            if (error instanceof ApiError) {
              return createResponse(error.statusCode, {
                success: false,
                error: error.message,
                details: error.details
              });
            }
            return createResponse(500, {
              success: false,
              error: 'Internal server error',
              details: error.message
            });
          }
        } else if (action === 'datasets') {
          try {
            const result = await new Promise((resolve, reject) => {
              const res = {
                json: (data) => resolve(data)
              };
              getAvailableDatasets(req, res, reject);
            });
            return createResponse(200, { success: true, ...result });
          } catch (error) {
            logger.error('❌ Datasets error:', error);
            if (error instanceof ApiError) {
              return createResponse(error.statusCode, {
                success: false,
                error: error.message
              });
            }
            return createResponse(500, {
              success: false,
              error: 'Internal server error',
              details: error.message
            });
          }
        }
        break;

      case 'trading':
        if (action === 'simulate' && method === 'POST') {
          try {
            // Validate request body
            if (!req.body.bids || !Array.isArray(req.body.bids) || req.body.bids.length === 0) {
              return createResponse(400, {
                success: false,
                error: 'Bids array is required and must not be empty'
              });
            }
            
            if (!req.body.date) {
              return createResponse(400, {
                success: false,
                error: 'Date is required'
              });
            }
            
            logger.info(`🎯 Processing trading simulation for ${req.body.bids.length} bids on ${req.body.date}`);
            
            const result = await new Promise((resolve, reject) => {
              const res = {
                json: (data) => resolve(data)
              };
              simulateTrades(req, res, reject);
            });
            
            logger.info(`✅ Trading simulation completed successfully`);
            return createResponse(200, { success: true, ...result });
          } catch (error) {
            logger.error('❌ Trading simulation error:', error);
            if (error instanceof ApiError) {
              return createResponse(error.statusCode, {
                success: false,
                error: error.message,
                details: error.details
              });
            }
            return createResponse(500, {
              success: false,
              error: 'Trading simulation failed',
              details: error.message
            });
          }
        }
        break;

      case 'analysis':
        if (action === 'ai-providers') {
          try {
            const result = await new Promise((resolve, reject) => {
              const res = {
                json: (data) => resolve(data)
              };
              getAIProviders(req, res, reject);
            });
            return createResponse(200, { success: true, ...result });
          } catch (error) {
            logger.error('❌ AI providers error:', error);
            if (error instanceof ApiError) {
              return createResponse(error.statusCode, {
                success: false,
                error: error.message
              });
            }
            return createResponse(500, {
              success: false,
              error: 'Internal server error',
              details: error.message
            });
          }
        } else if (action === 'spikes' && param && method === 'POST') {
          try {
            const result = await new Promise((resolve, reject) => {
              const res = {
                json: (data) => resolve(data)
              };
              analyzeSpikes(req, res, reject);
            });
            return createResponse(200, { success: true, ...result });
          } catch (error) {
            logger.error('❌ Spike analysis error:', error);
            if (error instanceof ApiError) {
              return createResponse(error.statusCode, {
                success: false,
                error: error.message
              });
            }
            return createResponse(500, {
              success: false,
              error: 'Internal server error',
              details: error.message
            });
          }
        } else if (action === 'ai' && method === 'POST') {
          try {
            const result = await new Promise((resolve, reject) => {
              const res = {
                json: (data) => resolve(data)
              };
              performAIAnalysis(req, res, reject);
            });
            return createResponse(200, { success: true, ...result });
          } catch (error) {
            logger.error('❌ AI analysis error:', error);
            if (error instanceof ApiError) {
              return createResponse(error.statusCode, {
                success: false,
                error: error.message
              });
            }
            return createResponse(500, {
              success: false,
              error: 'Internal server error',
              details: error.message
            });
          }
        }
        break;

      case 'cache':
        if (action === 'stats') {
          try {
            const result = getCacheStats(req, { json: (data) => data });
            return createResponse(200, { success: true, ...result });
          } catch (error) {
            logger.error('❌ Cache stats error:', error);
            return createResponse(500, {
              success: false,
              error: 'Cache stats failed',
              details: error.message
            });
          }
        } else if (method === 'DELETE') {
          try {
            const result = clearCache(req, { json: (data) => data });
            return createResponse(200, { success: true, ...result });
          } catch (error) {
            logger.error('❌ Cache clear error:', error);
            return createResponse(500, {
              success: false,
              error: 'Cache clear failed',
              details: error.message
            });
          }
        }
        break;

      default:
        logger.warn(`🔍 Route not found: ${resource} (from ${pathToProcess})`);
        return createResponse(404, {
          success: false,
          error: 'Route not found',
          details: `The requested endpoint ${method} ${pathname} does not exist`,
          debug: {
            originalPath: pathname,
            processedPath: pathToProcess,
            pathParts: pathParts,
            resource: resource,
            action: action,
            param: param
          }
        });
    }

    return createResponse(404, {
      success: false,
      error: 'Route not found',
      details: `No handler found for ${method} ${pathname}`
    });

  } catch (error) {
    logger.error('❌ Request error:', error);
    
    if (error instanceof ApiError) {
      return createResponse(error.statusCode, {
        success: false,
        error: error.message,
        details: error.details
      });
    }

    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      details: Netlify.env.get('NODE_ENV') !== 'production' ? error.message : undefined
    });
  }
};

// Main Netlify Function handler
export default async (request, context) => {
  try {
    return await handleRoute(request, context);
  } catch (error) {
    logger.error('❌ Function error:', error);
    return createResponse(500, {
      success: false,
      error: 'Function execution failed',
      details: error.message
    });
  }
};