import { getSpikeAnalyzer, getGridStatusClient } from '../config/services.js';
import { getAvailableProviders } from '../services/llmClient.js';
import { transformGridStatusRawToSpikeAnalysisFormat } from '../utils/marketData.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';

/**
 * Configuration constants
 */
const DEFAULT_TIMEZONE = 'America/Los_Angeles';

/**
 * Extract user timezone from request
 */
const getUserTimezone = (req) => {
  const { timezone } = req.query;
  const headerTimezone = req.get('X-User-Timezone');
  const bodyTimezone = req.body?.timezone;
  return timezone || headerTimezone || bodyTimezone || DEFAULT_TIMEZONE;
};

/**
 * Service getter utilities using unified services
 */
const getServices = () => ({
  spikeAnalyzer: getSpikeAnalyzer(),
  gridStatusClient: getGridStatusClient()
});

/**
 * Validate service availability
 */
const validateServices = (services) => {
  if (!services.spikeAnalyzer) {
    throw new ApiError('Spike analyzer not available', 503);
  }
  
  if (!services.gridStatusClient) {
    throw new ApiError('GridStatus API not configured. Please set GRIDSTATUS_API_KEY environment variable.', 503);
  }
};

/**
 * Handle GridStatus API errors with specific error mapping
 */
const handleGridStatusError = (error, date) => {
  const status = error.response?.status;
  const errorCode = error.code;
  
  // Map specific error types
  const errorMap = {
    429: 'GridStatus API rate limit exceeded. Please try again later.',
    404: `No market data available for ${date}. Please try a different date.`,
    401: 'Invalid GridStatus API key. Please check your configuration.',
    503: 'Unable to connect to GridStatus API. Please check your internet connection.'
  };
  
  if (errorMap[status]) {
    throw new ApiError(errorMap[status], status);
  }
  
  if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND') {
    throw new ApiError('Unable to connect to GridStatus API. Please check your internet connection.', 503);
  }
  
  // Generic error fallback
  throw new ApiError(`Failed to fetch market data: ${error.message}`, 500);
};

/**
 * Handle AI provider errors with specific error mapping
 */
const handleAIProviderError = (error) => {
  const message = error.message.toLowerCase();
  
  if (message.includes('api key')) {
    throw new ApiError('Invalid or missing AI provider API key', 401);
  }
  
  if (message.includes('rate limit') || message.includes('quota')) {
    throw new ApiError('AI provider rate limit exceeded. Please try again later.', 429);
  }
  
  // Re-throw ApiErrors as-is
  if (error instanceof ApiError) {
    throw error;
  }
  
  throw new ApiError('Failed to perform AI analysis', 500, error.message);
};

/**
 * Fetch and validate market data from GridStatus
 */
const fetchMarketData = async (gridStatusClient, date, userTimezone) => {
  try {
    // Fetch real-time price data
    logger.info('📡 Fetching real market data from GridStatus API');
    const { realTimeData } = await gridStatusClient.getMarketPrices(date);
    
    if (!realTimeData || realTimeData.length === 0) {
      throw new ApiError(`No market data available for ${date}. Please try a different date.`, 404);
    }
    
    logger.info(`✅ Retrieved ${realTimeData.length} real-time price records from GridStatus`);
    return realTimeData;
  } catch (error) {
    handleGridStatusError(error, date);
  }
};

/**
 * Transform and validate price data for spike analysis
 */
const transformPriceData = (realTimeData, userTimezone) => {
  try {
    const locationPriceData = transformGridStatusRawToSpikeAnalysisFormat(realTimeData, userTimezone);
    logger.info(`🔄 Transformed data into ${locationPriceData.length} location datasets for ${userTimezone}`);
    return locationPriceData;
  } catch (error) {
    logger.error('❌ Data transformation error:', error);
    throw new ApiError('Failed to transform market data for analysis', 500, error.message);
  }
};

/**
 * Perform spike detection analysis
 */
const performSpikeDetection = (spikeAnalyzer, locationPriceData, thresholds) => {
  try {
    const spikes = spikeAnalyzer.detectSpikes(locationPriceData, thresholds);
    logger.info(`🎯 Detected ${spikes.length} price spikes`);
    return spikes;
  } catch (error) {
    logger.error('❌ Spike detection error:', error);
    throw new ApiError('Failed to detect price spikes', 500, error.message);
  }
};

/**
 * Calculate analysis summary statistics
 */
const calculateAnalysisSummary = (spikes, locationPriceData, realTimeData) => {
  const totalDataPoints = locationPriceData.reduce((sum, loc) => sum + loc.prices.length, 0);
  const spikePercentage = totalDataPoints > 0 ? (spikes.length / totalDataPoints * 100).toFixed(2) : 0;
  
  return {
    totalSpikes: spikes.length,
    totalDataPoints,
    spikePercentage: parseFloat(spikePercentage),
    locationsAnalyzed: locationPriceData.length,
    dataSource: 'gridstatus',
    apiRecords: realTimeData.length
  };
};

/**
 * Create analysis results object
 */
const createAnalysisResults = (date, analysisType, spikes, summary, thresholds, userTimezone) => ({
  success: true,
  date,
  analysisType,
  spikes,
  summary,
  thresholds: thresholds,
  timezone: userTimezone,
  metadata: {
    analysisTimestamp: new Date().toISOString(),
    ...summary
  }
});

/**
 * Get available AI providers
 */
export const getAIProviders = async (req, res, next) => {
  try {
    const availableProviders = getAvailableProviders();
    
    logger.info(`🤖 Available AI providers: ${Object.keys(availableProviders).join(', ')}`);
    
    res.json({
      success: true,
      providers: availableProviders,
      count: Object.keys(availableProviders).length
    });
  } catch (error) {
    logger.error('❌ Error getting AI providers:', error);
    next(new ApiError('Failed to get AI providers', 500, error.message));
  }
};

/**
 * Analyze price spikes for a specific date with timezone support
 */
export const analyzeSpikes = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { analysisType, thresholds } = req.body;
    
    // Get user's timezone using consistent method
    const userTimezone = getUserTimezone(req);
    
    // Get and validate services
    const services = getServices();
    validateServices(services);
    
    logger.info(`🔍 Analyzing spikes for ${date} with type: ${analysisType} in timezone: ${userTimezone}`);
    
    // Fetch market data
    const realTimeData = await fetchMarketData(services.gridStatusClient, date, userTimezone);
    
    // Transform data for spike analysis
    const locationPriceData = transformPriceData(realTimeData, userTimezone);
    
    // Perform spike detection
    const spikes = performSpikeDetection(services.spikeAnalyzer, locationPriceData, thresholds);
    
    // Calculate summary statistics
    const summary = calculateAnalysisSummary(spikes, locationPriceData, realTimeData);
    
    // Create and send results
    const analysisResults = createAnalysisResults(date, analysisType, spikes, summary, thresholds, userTimezone);
    res.json(analysisResults);
    
  } catch (error) {
    logger.error('❌ Spike analysis error:', error);
    
    // Handle specific error types
    if (error instanceof ApiError) {
      return next(error);
    }
    
    next(new ApiError('Failed to analyze spikes', 500, error.message));
  }
};

/**
 * Validate AI analysis request
 */
const validateAIAnalysisRequest = (spike, contextData, llmConfig) => {
  if (!spike || typeof spike !== 'object') {
    throw new ApiError('Valid spike object is required for AI analysis', 400);
  }
  
  if (!contextData || typeof contextData !== 'object') {
    throw new ApiError('Valid context data is required for AI analysis', 400);
  }
  
  if (!llmConfig || !llmConfig.provider || !llmConfig.model) {
    throw new ApiError('Valid LLM configuration is required for AI analysis', 400);
  }
};

/**
 * Validate AI provider availability
 */
const validateAIProvider = (llmConfig) => {
  const availableProviders = getAvailableProviders();
  
  if (!availableProviders[llmConfig.provider]) {
    throw new ApiError(`AI provider '${llmConfig.provider}' is not configured. Please check your API keys.`, 400);
  }
};

/**
 * Initialize LLM for spike analyzer
 */
const initializeLLM = (spikeAnalyzer, llmConfig) => {
  try {
    spikeAnalyzer.initializeLLM(llmConfig);
    logger.info(`🧠 Performing AI analysis with ${llmConfig.provider} - ${llmConfig.model}`);
  } catch (error) {
    logger.error('❌ LLM initialization error:', error);
    throw new ApiError('Failed to initialize AI provider', 500, error.message);
  }
};

/**
 * Perform AI analysis on a price spike
 */
export const performAIAnalysis = async (req, res, next) => {
  try {
    const { spike, contextData, llmConfig } = req.body;
    
    // Validate request inputs
    validateAIAnalysisRequest(spike, contextData, llmConfig);
    
    // Validate AI provider availability
    validateAIProvider(llmConfig);
    
    // Get spike analyzer service
    const services = getServices();
    if (!services.spikeAnalyzer) {
      throw new ApiError('Spike analyzer not available', 503);
    }
    
    // Initialize LLM for this request
    initializeLLM(services.spikeAnalyzer, llmConfig);
    
    // Perform AI analysis
    const analysis = await services.spikeAnalyzer.analyzeWithAI(spike, contextData);
    
    logger.info(`✅ AI analysis complete with confidence: ${analysis.confidence}`);
    
    res.json({
      success: true,
      ...analysis
    });
    
  } catch (error) {
    logger.error('❌ AI analysis error:', error);
    
    try {
      handleAIProviderError(error);
    } catch (handledError) {
      return next(handledError);
    }
  }
};