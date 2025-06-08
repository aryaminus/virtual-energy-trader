import { getGridStatusClient, getDataCache } from '../config/services.js';
import { transformGridStatusData } from '../utils/marketData.js';
import { simulateTradeExecution } from '../utils/trading.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';

/**
 * Configuration constants
 */
const DEFAULT_ISO = 'CAISO';
const DEFAULT_TIMEZONE = 'America/Los_Angeles';
const CACHE_KEY_MARKET_DATA = 'market-data';

/**
 * Service getter utilities using unified services
 */
const getServices = () => ({
  gridStatusClient: getGridStatusClient(),
  dataCache: getDataCache()
});

/**
 * Validate service availability
 */
const validateServices = (services) => {
  if (!services.gridStatusClient) {
    logger.error('❌ GridStatus API not configured for trading simulation');
    throw new ApiError('GridStatus API not configured. Please set GRIDSTATUS_API_KEY environment variable.', 503);
  }
  
  if (!services.dataCache) {
    logger.warn('⚠️ Data cache not available');
  }
};

/**
 * Extract user timezone from request
 */
const getUserTimezone = (req) => {
  const { timezone } = req.query;
  const headerTimezone = req.get('X-User-Timezone');
  return timezone || headerTimezone || DEFAULT_TIMEZONE;
};

/**
 * Validate trading simulation request
 */
const validateTradingRequest = (bids, date) => {
  if (!Array.isArray(bids) || bids.length === 0) {
    throw new ApiError('Please add at least one bid to simulate', 400);
  }
  
  if (!date) {
    throw new ApiError('Please select a date for simulation', 400);
  }
  
  // Validate individual bids
  bids.forEach((bid, index) => {
    validateBid(bid, index);
  });
  
  logger.info(`✅ Validated ${bids.length} bids for simulation`);
};

/**
 * Validate individual bid structure
 */
const validateBid = (bid, index) => {
  const requiredFields = ['id', 'hour', 'type', 'price', 'quantity'];
  
  requiredFields.forEach(field => {
    if (bid[field] === undefined || bid[field] === null) {
      throw new ApiError(`Bid ${index}: ${field} is required`, 400);
    }
  });
  
  if (typeof bid.hour !== 'number' || bid.hour < 0 || bid.hour > 23) {
    throw new ApiError(`Bid ${index}: hour must be between 0 and 23`, 400);
  }
  
  if (!['buy', 'sell'].includes(bid.type)) {
    throw new ApiError(`Bid ${index}: type must be 'buy' or 'sell'`, 400);
  }
  
  if (typeof bid.price !== 'number' || bid.price < 0) {
    throw new ApiError(`Bid ${index}: price must be a positive number`, 400);
  }
  
  if (typeof bid.quantity !== 'number' || bid.quantity <= 0) {
    throw new ApiError(`Bid ${index}: quantity must be a positive number`, 400);
  }
};

/**
 * Create cache key for market data
 */
const createCacheKey = (date, iso, timezone) => ({
  key: CACHE_KEY_MARKET_DATA,
  params: { date, iso, timezone }
});

/**
 * Check cache for existing market data
 */
const getCachedMarketData = (dataCache, date, iso, userTimezone) => {
  if (!dataCache) return null;
  
  const { key, params } = createCacheKey(date, iso, userTimezone);
  const cachedData = dataCache.get(key, params);
  
  if (cachedData) {
    logger.info(`📦 Using cached market data for ${date} (${iso}) in ${userTimezone}`);
    return cachedData;
  }
  
  return null;
};

/**
 * Cache market data for future requests
 */
const cacheMarketData = (dataCache, date, iso, userTimezone, marketData) => {
  if (!dataCache) return;
  
  const { key, params } = createCacheKey(date, iso, userTimezone);
  dataCache.set(key, params, marketData);
  logger.info(`💾 Cached market data for ${date} (${iso}) in ${userTimezone}`);
};

/**
 * Handle GridStatus API errors with specific error mapping
 */
const handleGridStatusError = (error, date, iso) => {
  const status = error.response?.status;
  const errorCode = error.code;
  
  // Map specific error types to user-friendly messages
  const errorMap = {
    429: 'GridStatus API rate limit exceeded. Please try again later.',
    404: `No market data available for ${iso} on ${date}. Please try a different date.`,
    401: 'Invalid GridStatus API key. Please check your configuration.',
    503: 'GridStatus API service unavailable. Please try again later.'
  };
  
  if (errorMap[status]) {
    throw new ApiError(errorMap[status], status);
  }
  
  // Handle network errors
  if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND') {
    throw new ApiError('Unable to connect to GridStatus API. Please check your internet connection.', 503);
  }
  
  // Generic error fallback
  throw new ApiError(`Failed to simulate trades: ${error.message}`, 500);
};

/**
 * Fetch market data from GridStatus API
 */
const fetchMarketData = async (gridStatusClient, date, iso) => {
  try {
    logger.info(`📊 Fetching day-ahead prices for ${iso} on ${date}`);
    const dayAheadData = await gridStatusClient.getDayAheadPrices(date, iso);
    
    logger.info(`📊 Fetching real-time prices for ${iso} on ${date}`);
    const realTimeData = await gridStatusClient.getRealTimePrices(date, iso);
    
    logger.info(`✅ Successfully fetched market data: ${dayAheadData.length} DA, ${realTimeData.length} RT records`);
    
    return { dayAheadData, realTimeData };
  } catch (error) {
    logger.error('❌ Failed to fetch market data for simulation:', error);
    throw error;
  }
};

/**
 * Transform market data with timezone conversion
 */
const transformMarketData = (dayAheadData, realTimeData, userTimezone, date) => {
  try {
    const marketData = transformGridStatusData(dayAheadData, realTimeData, userTimezone, date);
    
    // Validate transformed data
    if (!marketData.dayAheadPrices || !marketData.realTimePrices) {
      throw new Error('Invalid market data structure after transformation');
    }
    
    logger.info(`✅ Successfully transformed market data for ${userTimezone}`);
    return marketData;
  } catch (error) {
    logger.error('❌ Market data transformation failed:', error);
    throw new ApiError('Failed to transform market data for simulation', 500, error.message);
  }
};

/**
 * Execute trading simulation
 */
const executeSimulation = (bids, marketData, userTimezone) => {
  try {
    logger.info(`🎯 Executing simulation for ${bids.length} bids in ${userTimezone}`);
    
    const simulation = simulateTradeExecution(bids, marketData.dayAheadPrices, marketData.realTimePrices);
    
    const executedCount = simulation.trades.filter(t => t.executed).length;
    logger.info(`✅ Simulation complete: ${executedCount}/${bids.length} trades executed`);
    
    return simulation;
  } catch (error) {
    logger.error('❌ Trading simulation execution failed:', error);
    throw new ApiError('Failed to execute trading simulation', 500, error.message);
  }
};

/**
 * Create simulation response
 */
const createSimulationResponse = (simulation, marketData, userTimezone, metadata) => ({
  success: true,
  simulation,
  marketData,
  timezone: userTimezone,
  metadata: {
    ...metadata,
    timestamp: new Date().toISOString()
  }
});

/**
 * Calculate simulation metadata
 */
const calculateSimulationMetadata = (bids, simulation, date, iso) => {
  const executedTrades = simulation.trades.filter(t => t.executed).length;
  
  return {
    totalBids: bids.length,
    executedTrades,
    successRate: bids.length > 0 ? ((executedTrades / bids.length) * 100).toFixed(1) : 0,
    date,
    iso,
    totalProfit: simulation.totalProfit,
    avgProfitPerTrade: executedTrades > 0 ? (simulation.totalProfit / executedTrades).toFixed(2) : 0
  };
};

/**
 * Simulate trading with user bids with timezone support
 */
export const simulateTrades = async (req, res, next) => {
  try {
    const { bids, date } = req.body;
    const { iso = DEFAULT_ISO } = req.query;
    const userTimezone = getUserTimezone(req);
    
    logger.info(`🎯 Processing trading simulation for ${bids?.length || 0} bids on ${date} (${iso}) in timezone ${userTimezone}`);
    
    // Validate request inputs
    validateTradingRequest(bids, date);
    
    // Get and validate services
    const services = getServices();
    validateServices(services);
    
    // Check cache for existing market data
    let marketData = getCachedMarketData(services.dataCache, date, iso, userTimezone);
    
    if (!marketData) {
      // Fetch market data from API
      const { dayAheadData, realTimeData } = await fetchMarketData(services.gridStatusClient, date, iso);
      
      // Transform data with timezone conversion
      marketData = transformMarketData(dayAheadData, realTimeData, userTimezone, date);
      
      // Cache the transformed data
      cacheMarketData(services.dataCache, date, iso, userTimezone, marketData);
    }
    
    // Execute trading simulation
    const simulation = executeSimulation(bids, marketData, userTimezone);
    
    // Calculate metadata
    const metadata = calculateSimulationMetadata(bids, simulation, date, iso);
    
    // Create and send response
    const response = createSimulationResponse(simulation, marketData, userTimezone, metadata);
    res.json(response);
    
  } catch (error) {
    logger.error('❌ Trading simulation error:', error);
    
    // Handle specific error types
    if (error instanceof ApiError) {
      return next(error);
    }
    
    // Handle GridStatus API errors
    try {
      handleGridStatusError(error, req.body.date, req.query.iso || DEFAULT_ISO);
    } catch (gridError) {
      return next(gridError);
    }
    
    // Generic error fallback
    next(new ApiError('Failed to simulate trades', 500, error.message));
  }
};