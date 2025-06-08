import GridStatusClient from '../services/gridstatus.js';
import DataCache from '../services/dataCache.js';
import SpikeAnalyzer from '../services/spikeAnalyzer.js';
import { logger } from '../utils/logger.js';

// Global service instances
let gridStatusClient = null;
let dataCache = null;
let spikeAnalyzer = null;
let servicesInitialized = false;
let environmentType = null;

/**
 * Detect environment type based on context
 * @returns {'express'|'netlify'} Environment type
 */
export const getEnvironmentType = () => {
  if (environmentType !== null) return environmentType;
  
  // Check if we're in a Netlify Functions environment
  // Since Netlify Functions use process.env (like regular Node.js), we detect by other means
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    environmentType = 'netlify';
  } else {
    environmentType = 'express';
  }
  
  return environmentType;
};

/**
 * Initialize all services with unified environment detection
 */
export const initializeServices = async () => {
  if (servicesInitialized) return;
  
  try {
    const envType = getEnvironmentType();
    logger.info(`🔧 Initializing services for ${envType} environment...`);

    // Initialize GridStatus client
    // Both Express and Netlify Functions use process.env according to Netlify docs
    const apiKey = process.env.GRIDSTATUS_API_KEY;
    if (apiKey) {
      gridStatusClient = new GridStatusClient(apiKey);
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

    servicesInitialized = true;
    logger.info(`🎉 All services initialized successfully for ${envType}`);
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    throw error;
  }
};

/**
 * Set service instances (for external initialization)
 */
export const setServices = (gridStatus, cache, analyzer) => {
  gridStatusClient = gridStatus;
  dataCache = cache;
  spikeAnalyzer = analyzer;
  servicesInitialized = true;
};

/**
 * Get GridStatus client instance
 * @returns {GridStatusClient|null}
 */
export const getGridStatusClient = () => gridStatusClient;

/**
 * Get data cache instance
 * @returns {DataCache}
 */
export const getDataCache = () => dataCache;

/**
 * Get spike analyzer instance
 * @returns {SpikeAnalyzer}
 */
export const getSpikeAnalyzer = () => spikeAnalyzer;

/**
 * Check if services are initialized
 * @returns {boolean}
 */
export const areServicesInitialized = () => servicesInitialized;

/**
 * Reset services (for testing)
 */
export const resetServices = () => {
  gridStatusClient = null;
  dataCache = null;
  spikeAnalyzer = null;
  servicesInitialized = false;
  environmentType = null;
};

// Backward compatibility aliases
export const initializeUnifiedServices = initializeServices;
export const setUnifiedServices = setServices;