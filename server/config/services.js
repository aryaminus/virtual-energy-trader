import GridStatusClient from '../services/gridstatus.js';
import DataCache from '../services/dataCache.js';
import SpikeAnalyzer from '../services/spikeAnalyzer.js';
import { logger } from '../utils/logger.js';

// Global service instances
let gridStatusClient = null;
let dataCache = null;
let spikeAnalyzer = null;

/**
 * Initialize all services
 */
export const initializeServices = async () => {
  try {
    logger.info('🔧 Initializing services...');

    // Initialize GridStatus client
    if (process.env.GRIDSTATUS_API_KEY) {
      gridStatusClient = new GridStatusClient(process.env.GRIDSTATUS_API_KEY);
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

    logger.info('🎉 All services initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    throw error;
  }
};

/**
 * Set service instances (for Netlify Functions)
 */
export const setServices = (gridStatus, cache, analyzer) => {
  gridStatusClient = gridStatus;
  dataCache = cache;
  spikeAnalyzer = analyzer;
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