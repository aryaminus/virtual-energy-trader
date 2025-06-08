import { getGridStatusClient, getDataCache } from '../config/services.js';
import { transformGridStatusData } from '../utils/marketData.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';

/**
 * Configuration constants
 */
const DEFAULT_ISO = 'CAISO';
const DEFAULT_TIMEZONE = 'America/Los_Angeles';
const CACHE_KEY_MARKET_DATA = 'market-data';
const CACHE_KEY_DATASETS = 'datasets';

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
    logger.error('❌ GridStatus API not configured');
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
    logger.info(`📦 Serving cached market data for ${date} (${iso}) in ${userTimezone}`);
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
  throw new ApiError(`Failed to fetch market data from GridStatus API: ${error.message}`, 500);
};

/**
 * Fetch market prices from GridStatus API
 */
const fetchMarketPrices = async (gridStatusClient, date, iso) => {
  try {
    logger.info(`🔄 Fetching market data for ${date} from GridStatus API...`);
    
    const { dayAheadData, realTimeData } = await gridStatusClient.getMarketPrices(date, iso);
    
    logger.info(`✅ Successfully fetched data from GridStatus API`);
    return { dayAheadData, realTimeData };
  } catch (error) {
    logger.error('❌ Failed to fetch market prices:', error);
    throw error;
  }
};

/**
 * Transform and validate market data
 */
const transformMarketData = (dayAheadData, realTimeData, userTimezone, date) => {
  try {
    const marketData = transformGridStatusData(dayAheadData, realTimeData, userTimezone, date);
    
    // Validate transformed data
    if (!marketData.dayAheadPrices || !marketData.realTimePrices) {
      throw new Error('Invalid market data structure after transformation');
    }
    
    logger.info(`✅ Successfully transformed data for ${userTimezone}`);
    return marketData;
  } catch (error) {
    logger.error('❌ Market data transformation failed:', error);
    throw new ApiError('Failed to transform market data', 500, error.message);
  }
};

/**
 * Create market data response
 */
const createMarketDataResponse = (date, marketData, source, userTimezone, metadata = {}) => ({
  success: true,
  date,
  data: marketData,
  source,
  timezone: userTimezone,
  metadata: {
    ...metadata,
    timestamp: new Date().toISOString()
  }
});

/**
 * Get market data for a specific date with timezone conversion
 */
export const getMarketData = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { iso = DEFAULT_ISO } = req.query;
    const userTimezone = getUserTimezone(req);
    
    logger.info(`📊 Processing market data request for ${date} (${iso}) in ${userTimezone}`);
    
    // Get and validate services
    const services = getServices();
    validateServices(services);
    
    // Check cache first
    const cachedData = getCachedMarketData(services.dataCache, date, iso, userTimezone);
    if (cachedData) {
      return res.json(createMarketDataResponse(date, cachedData, 'cache', userTimezone));
    }
    
    // Fetch market prices
    const { dayAheadData, realTimeData } = await fetchMarketPrices(services.gridStatusClient, date, iso);
    
    // Transform data with timezone conversion
    const marketData = transformMarketData(dayAheadData, realTimeData, userTimezone, date);
    
    // Cache the result
    cacheMarketData(services.dataCache, date, iso, userTimezone, marketData);
    
    // Create response with metadata
    const responseMetadata = {
      dayAheadRecords: dayAheadData.length,
      realTimeRecords: realTimeData.length
    };
    
    res.json(createMarketDataResponse(date, marketData, 'gridstatus-api', userTimezone, responseMetadata));
    
  } catch (error) {
    logger.error('❌ Market data error:', error);
    
    // Handle specific error types
    if (error instanceof ApiError) {
      return next(error);
    }
    
    // Handle GridStatus API errors
    try {
      handleGridStatusError(error, req.params.date, req.query.iso || DEFAULT_ISO);
    } catch (gridError) {
      return next(gridError);
    }
    
    // Generic error fallback
    next(new ApiError('Failed to fetch market data', 500, error.message));
  }
};

/**
 * Check cache for datasets
 */
const getCachedDatasets = (dataCache) => {
  if (!dataCache) return null;
  
  const cachedData = dataCache.get(CACHE_KEY_DATASETS, {});
  if (cachedData) {
    logger.info(`📦 Serving cached datasets`);
    return cachedData;
  }
  
  return null;
};

/**
 * Cache datasets for future requests
 */
const cacheDatasets = (dataCache, datasets) => {
  if (!dataCache) return;
  
  dataCache.set(CACHE_KEY_DATASETS, {}, datasets);
  logger.info(`💾 Cached ${datasets.length} datasets`);
};

/**
 * Filter datasets for CAISO relevance
 */
const filterRelevantDatasets = (datasets) => {
  const relevantDatasets = datasets.filter(dataset => 
    dataset.source === 'caiso' && (
      dataset.id.includes('lmp') || 
      dataset.id.includes('load') ||
      dataset.name.toLowerCase().includes('lmp') ||
      dataset.name.toLowerCase().includes('load')
    )
  );
  
  logger.info(`🔍 Filtered ${relevantDatasets.length} relevant CAISO datasets from ${datasets.length} total`);
  return relevantDatasets;
};

/**
 * Fetch datasets from GridStatus API
 */
const fetchDatasets = async (gridStatusClient) => {
  try {
    logger.info('📋 Fetching available datasets from GridStatus API...');
    
    const datasets = await gridStatusClient.getAvailableDatasets();
    
    if (!Array.isArray(datasets)) {
      throw new Error('Invalid datasets response format');
    }
    
    logger.info(`✅ Successfully fetched ${datasets.length} datasets`);
    return datasets;
  } catch (error) {
    logger.error('❌ Failed to fetch datasets:', error);
    throw error;
  }
};

/**
 * Create datasets response
 */
const createDatasetsResponse = (datasets, relevantDatasets) => ({
  success: true,
  datasets: relevantDatasets,
  total: datasets.length,
  relevant: relevantDatasets.length,
  metadata: {
    timestamp: new Date().toISOString(),
    source: 'gridstatus-api'
  }
});

/**
 * Get available datasets from GridStatus API
 */
export const getAvailableDatasets = async (req, res, next) => {
  try {
    logger.info('📋 Processing datasets request...');
    
    // Get and validate services
    const services = getServices();
    if (!services.gridStatusClient) {
      throw new ApiError('GridStatus API not configured', 503);
    }
    
    // Check cache first
    const cachedDatasets = getCachedDatasets(services.dataCache);
    if (cachedDatasets) {
      const relevantDatasets = filterRelevantDatasets(cachedDatasets);
      return res.json(createDatasetsResponse(cachedDatasets, relevantDatasets));
    }
    
    // Fetch datasets from API (this will handle connection testing internally)
    const datasets = await fetchDatasets(services.gridStatusClient);
    
    // Cache the results
    cacheDatasets(services.dataCache, datasets);
    
    // Filter for relevant datasets
    const relevantDatasets = filterRelevantDatasets(datasets);
    
    res.json(createDatasetsResponse(datasets, relevantDatasets));
    
  } catch (error) {
    logger.error('❌ Failed to fetch datasets:', error);
    
    // Handle specific error types
    const status = error.response?.status;
    
    if (status === 429) {
      return next(new ApiError('GridStatus API rate limit exceeded. Please try again later.', 429));
    }
    
    if (status === 401) {
      return next(new ApiError('Invalid GridStatus API key', 401));
    }
    
    if (error instanceof ApiError) {
      return next(error);
    }
    
    next(new ApiError('Failed to fetch available datasets', 500, error.message));
  }
};