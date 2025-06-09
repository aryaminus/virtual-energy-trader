import axios from 'axios';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';
import DataCache from './dataCache.js';

/**
 * GridStatus API client for fetching electricity market data
 * All server-side operations use Pacific Time (America/Los_Angeles) for CAISO consistency
 */
class GridStatusClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = process.env.GRIDSTATUS_BASE_URL || 'https://api.gridstatus.io';
    this.timezone = 'America/Los_Angeles'; // CAISO operates in Pacific Time
    
    // Simple rate limiting - 1 request per 2 seconds (GridStatus limit is 1/sec)
    this.lastRequestTime = 0;
    this.minRequestInterval = 2000; // 2 seconds for safety margin
    
    // Cache configuration using shared DataCache
    this.datasetsCache = new DataCache(240); // 4 hours in minutes
    
    this.client = this.createAxiosClient();
  }

  /**
   * Create and configure Axios client with interceptors
   */
  createAxiosClient() {
    const client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'VirtualEnergyTrader/1.0.0'
      },
      timeout: 8000 // 8 seconds for Netlify 10s limit
    });

    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        logger.debug(`🔄 GridStatus API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('❌ GridStatus API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        logger.debug(`✅ GridStatus API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`❌ GridStatus API Response Error: ${error.response?.status} ${error.config?.url}`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Get Pacific Time date range for CAISO operations
   */
  getPacificTimeRange(date) {
    const startTime = `${date}T00:00:00-08:00`;
    const endTime = `${date}T23:59:59-08:00`;
    
    return {
      startTime,
      endTime,
      timezone: this.timezone
    };
  }

  /**
   * Validate date format and constraints
   */
  validateDate(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new ApiError(`Invalid date format: ${date}. Expected YYYY-MM-DD format.`, 400);
    }
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new ApiError(`Invalid date: ${date}`, 400);
    }
    
    // Check if date is not too far in the future
    const today = new Date();
    const todayPacific = new Date(today.toLocaleString('en-US', { timeZone: this.timezone }));
    const maxDate = new Date(todayPacific.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    if (parsedDate > maxDate) {
      throw new ApiError(`Date ${date} is too far in the future. GridStatus typically provides data up to 7 days ahead.`, 400);
    }
    
    return true;
  }


  /**
   * Simple rate-limited request wrapper with proper 429 handling
   */
  async makeRateLimitedRequest(requestFn) {
    // Simple rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.minRequestInterval - timeSinceLastRequest);
    
    if (waitTime > 0) {
      logger.info(`⏳ Rate limiting: waiting ${waitTime}ms before GridStatus API call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    
    try {
      const result = await requestFn();
      logger.debug(`✅ GridStatus API call successful`);
      return result;
    } catch (error) {
      // Handle rate limit errors with exponential backoff
      if (error.response?.status === 429) {
        logger.warn('⚠️  Rate limited by GridStatus API, implementing backoff');
        
        // Extract retry-after header if available
        const retryAfter = error.response?.headers?.['retry-after'];
        const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : 3000; // 3 seconds default
        
        logger.warn(`⏳ Backing off for ${backoffTime}ms due to rate limit`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        // Update last request time to include backoff
        this.lastRequestTime = Date.now();
        
        // Retry once after backoff
        try {
          const retryResult = await requestFn();
          logger.info(`✅ GridStatus API retry successful after rate limit`);
          return retryResult;
        } catch (retryError) {
          logger.error(`❌ GridStatus API retry failed: ${retryError.message}`);
          throw new ApiError('GridStatus API rate limit exceeded. Please try again later.', 429);
        }
      }
      
      // Handle other error types
      if (error.response?.status === 401) {
        throw new ApiError('Invalid GridStatus API key', 401);
      }
      if (error.response?.status === 404) {
        throw new ApiError('GridStatus API endpoint not found', 404);
      }
      
      throw error;
    }
  }

  /**
   * Test API connection and key validity
   */
  async testConnection() {
    try {
      logger.info('🔍 Testing GridStatus API connection...');
      
      const response = await this.makeRateLimitedRequest(async () => {
        return await this.client.get('/v1/datasets', {
          params: { page_size: 1 }
        });
      });
      
      logger.info('✅ GridStatus API connection successful');
      return { 
        success: true, 
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw this.handleConnectionError(error);
    }
  }

  /**
   * Handle connection errors with specific error types
   */
  handleConnectionError(error) {
    const status = error.response?.status;
    
    switch (status) {
      case 401:
        return new ApiError('Invalid API key. Please check your GRIDSTATUS_API_KEY.', 401);
      case 404:
        return new ApiError('API endpoint not found. The GridStatus API structure may have changed.', 404);
      default:
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          return new ApiError('Unable to connect to GridStatus API. Please check your internet connection.', 503);
        }
        return new ApiError(`GridStatus API connection failed: ${error.message}`, 500);
    }
  }

  /**
   * Get available datasets with caching
   */
  async getAvailableDatasets() {
    const endpoint = '/v1/datasets';
    const params = {};
    const cached = this.datasetsCache.get(endpoint, params);
    
    if (cached) {
      logger.info(`📦 Using cached datasets (${cached.length} datasets)`);
      return cached;
    }
    
    try {
      logger.info('📋 Fetching available datasets...');
      
      const response = await this.makeRateLimitedRequest(async () => {
        return await this.client.get('/v1/datasets');
      });
      
      const datasets = response.data?.data || [];
      
      // Cache the results using shared DataCache
      this.datasetsCache.set(endpoint, params, datasets);
      
      logger.info(`✅ Successfully fetched ${datasets.length} available datasets`);
      return datasets;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Failed to fetch available datasets: ${error.message}`, 500);
    }
  }

  /**
   * Find CAISO LMP datasets with caching
   */
  async findCAISOLMPDatasets() {
    try {
      const datasets = await this.getAvailableDatasets();
      
      const caisoLMPDatasets = datasets.filter(dataset => 
        dataset.source?.toLowerCase() === 'caiso' && 
        (dataset.id.includes('lmp') || dataset.name.toLowerCase().includes('lmp'))
      );
      
      logger.info(`🔍 Found ${caisoLMPDatasets.length} CAISO LMP datasets`);
      
      const dayAheadDataset = this.findDatasetByType(caisoLMPDatasets, 'day_ahead');
      const realTimeDataset = this.findDatasetByType(caisoLMPDatasets, 'real_time');
      
      logger.info(`📊 Day-ahead dataset: ${dayAheadDataset?.id || 'Not found'}`);
      logger.info(`📊 Real-time dataset: ${realTimeDataset?.id || 'Not found'}`);
      
      return {
        dayAhead: dayAheadDataset,
        realTime: realTimeDataset,
        all: caisoLMPDatasets
      };
    } catch (error) {
      logger.warn('⚠️  Could not fetch CAISO LMP datasets:', error.message);
      return { dayAhead: null, realTime: null, all: [] };
    }
  }

  /**
   * Find dataset by type (day_ahead or real_time)
   */
  findDatasetByType(datasets, type) {
    const patterns = {
      day_ahead: ['dam', 'day_ahead', 'day ahead', 'hourly'],
      real_time: ['rtm', 'real_time', 'real time', '5_min', '15_min', 'hasp']
    };
    
    return datasets.find(d => 
      patterns[type].some(pattern => 
        d.id.toLowerCase().includes(pattern) || 
        d.name.toLowerCase().includes(pattern)
      )
    );
  }

  /**
   * Get both day-ahead and real-time prices for a specific date
   */
  async getMarketPrices(date, iso = 'CAISO') {
    this.validateDate(date);
    
    logger.info(`📊 Fetching market prices for ${iso} on ${date} (Pacific Time)`);
    
    const datasets = await this.findCAISOLMPDatasets();
    const { startTime, endTime, timezone } = this.getPacificTimeRange(date);
    logger.info(`🕐 Query range: ${startTime} to ${endTime} (${timezone})`);
    
    const [dayAheadData, realTimeData] = await Promise.all([
      this.fetchDatasetData(datasets.dayAhead, startTime, endTime, timezone, 'day-ahead'),
      this.fetchDatasetData(datasets.realTime, startTime, endTime, timezone, 'real-time')
    ]);
    
    this.logDataDistribution(dayAheadData, 'day-ahead');
    this.logDataDistribution(realTimeData, 'real-time');
    
    if (dayAheadData.length === 0 && realTimeData.length === 0) {
      throw new ApiError(`No market data available for ${iso} on ${date}. The date may be too recent or too old.`, 404);
    }
    
    return { dayAheadData, realTimeData };
  }

  /**
   * Fetch data from a specific dataset
   */
  async fetchDatasetData(dataset, startTime, endTime, timezone, type) {
    if (!dataset) {
      logger.warn(`⚠️  No ${type} dataset found`);
      return [];
    }
    
    try {
      logger.info(`📊 Fetching ${type} data from: ${dataset.id}`);
      
      const response = await this.makeRateLimitedRequest(async () => {
        return await this.client.get(`/v1/datasets/${dataset.id}/query`, {
          params: {
            start_time: startTime,
            end_time: endTime,
            page_size: type === 'day-ahead' ? 2000 : 4000,
            timezone: timezone
          }
        });
      });
      
      const data = response.data?.data || [];
      logger.info(`✅ Fetched ${data.length} ${type} records`);
      return data;
    } catch (error) {
      logger.warn(`⚠️  Failed to fetch ${type} data: ${error.message}`);
      return [];
    }
  }

  /**
   * Log data distribution analysis
   */
  logDataDistribution(data, type) {
    if (data.length === 0) return;
    
    const hourCounts = {};
    const locationCounts = {};
    
    data.forEach(item => {
      const timestamp = item.interval_start_utc || item.interval_start_local || item.timestamp;
      const location = item.location || item.pnode || 'unknown';
      
      if (timestamp) {
        const date = new Date(timestamp);
        const pacificTime = new Date(date.toLocaleString('en-US', { timeZone: this.timezone }));
        const hour = pacificTime.getHours();
        
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    });
    
    const topLocations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([loc, count]) => `${loc}(${count})`)
      .join(', ');
    
    logger.info(`📊 ${type} locations: ${Object.keys(locationCounts).length} unique locations`);
    logger.info(`📊 ${type} top locations: ${topLocations}`);
    logger.info(`📊 ${type} data distribution (Pacific Time): ${JSON.stringify(hourCounts)}`);
  }

  /**
   * Get day-ahead prices for a specific date
   */
  async getDayAheadPrices(date, iso = 'CAISO') {
    const { dayAheadData } = await this.getMarketPrices(date, iso);
    return dayAheadData;
  }

  /**
   * Get real-time prices for a specific date
   */
  async getRealTimePrices(date, iso = 'CAISO') {
    const { realTimeData } = await this.getMarketPrices(date, iso);
    return realTimeData;
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats() {
    try {
      logger.info('📈 Fetching API usage statistics...');
      
      const response = await this.makeRateLimitedRequest(async () => {
        return await this.client.get('/v1/usage');
      });
      
      logger.info('✅ Successfully fetched API usage statistics');
      return response.data;
    } catch (error) {
      logger.warn('⚠️  Unable to fetch usage statistics:', error.message);
      return null;
    }
  }
}

export default GridStatusClient;