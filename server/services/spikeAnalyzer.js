import { GridAnalysisLLM } from './llmClient.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';

/**
 * Configuration constants for spike detection
 */
const DEFAULT_THRESHOLDS = {
  minMagnitude: 5,
  minDuration: 15,
  spatialRadius: 50,
  zScoreThreshold: 1.5
};

const SEVERITY_THRESHOLDS = {
  critical: 50,
  high: 25,
  medium: 10,
  low: 0
};

const WINDOW_SIZE = 6; // 30-minute window for 5-min data

/**
 * Spike Analyzer service for detecting and analyzing price spikes
 */
class SpikeAnalyzer {
  constructor() {
    this.llmClient = null;
  }

  /**
   * Initialize LLM client with configuration
   */
  initializeLLM(config) {
    try {
      this.llmClient = new GridAnalysisLLM(config);
      logger.info(`🧠 Initialized LLM client with ${config.provider} - ${config.model}`);
    } catch (error) {
      logger.error('❌ Failed to initialize LLM client:', error.message);
      throw new ApiError(`Failed to initialize AI client: ${error.message}`, 500);
    }
  }

  /**
   * Detect price spikes using statistical analysis
   */
  detectSpikes(priceData, thresholds = {}) {
    this.validatePriceData(priceData);
    
    const config = { ...DEFAULT_THRESHOLDS, ...thresholds };
    logger.info(`🔍 Detecting spikes with thresholds: magnitude=${config.minMagnitude}, zScore=${config.zScoreThreshold}, spatialRadius=${config.spatialRadius}`);

    const spikes = [];
    
    try {
      priceData.forEach((locationData, locationIndex) => {
        const locationSpikes = this.analyzeLocationSpikes(locationData, locationIndex, config, priceData);
        spikes.push(...locationSpikes);
      });

      const filteredSpikes = this.filterDuplicateSpikes(spikes);
      logger.info(`📊 Detected ${filteredSpikes.length} price spikes (${spikes.length} before filtering)`);
      
      return filteredSpikes;
    } catch (error) {
      logger.error('❌ Spike detection error:', error);
      throw new ApiError(`Spike detection failed: ${error.message}`, 500);
    }
  }

  /**
   * Validate input price data
   */
  validatePriceData(priceData) {
    if (!priceData || priceData.length === 0) {
      throw new ApiError('Price data is required for spike detection', 400);
    }
  }

  /**
   * Analyze spikes for a specific location
   */
  analyzeLocationSpikes(locationData, locationIndex, config, allPriceData) {
    const { location, prices } = locationData;
    
    if (!prices || prices.length === 0) {
      throw new ApiError(`No price data available for location ${location}`, 400);
    }
        
    const spikes = [];
    
    for (let i = WINDOW_SIZE; i < prices.length; i++) {
      const spike = this.detectSpikeAtIndex(prices, i, location, locationIndex, config, allPriceData);
      if (spike) {
        spikes.push(spike);
        logger.info(`🎯 Spike detected: ${location} at ${prices[i].timestamp}, magnitude: $${spike.magnitude.toFixed(2)}, zScore: ${spike.zScore.toFixed(2)}`);
      }
    }
    
    return spikes;
  }

  /**
   * Detect spike at specific price index
   */
  detectSpikeAtIndex(prices, index, location, locationIndex, config, allPriceData) {
    const window = prices.slice(index - WINDOW_SIZE, index);
    const { mean, stdDev } = this.calculateStatistics(window);
    
    const currentPrice = prices[index].price;
    const zScore = stdDev > 0 ? Math.abs(currentPrice - mean) / stdDev : 0;
    const magnitude = Math.abs(currentPrice - mean);
    
    if (this.isSpikeDetected(zScore, magnitude, config)) {
      return this.createSpikeObject(
        prices[index], 
        location, 
        locationIndex, 
        currentPrice, 
        mean, 
        magnitude, 
        zScore, 
        config, 
        allPriceData, 
        index
      );
    }
    
    return null;
  }

  /**
   * Calculate statistical measures for a price window
   */
  calculateStatistics(window) {
    const mean = window.reduce((sum, p) => sum + p.price, 0) / window.length;
    const variance = window.reduce((sum, p) => sum + Math.pow(p.price - mean, 2), 0) / window.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev, variance };
  }

  /**
   * Check if spike detection criteria are met
   */
  isSpikeDetected(zScore, magnitude, config) {
    const { zScoreThreshold, minMagnitude } = config;
    
    // More lenient detection: either high z-score OR significant magnitude
    return (zScore > zScoreThreshold && magnitude > minMagnitude) || 
           magnitude > minMagnitude * 2;
  }

  /**
   * Create spike object with all required properties
   */
  createSpikeObject(pricePoint, location, locationIndex, currentPrice, mean, magnitude, zScore, config, allPriceData, index) {
    return {
      id: `spike-${locationIndex}-${index}-${Date.now()}`,
      timestamp: pricePoint.timestamp,
      location,
      price: currentPrice,
      baselinePrice: mean,
      magnitude,
      type: currentPrice > mean ? 'positive' : 'negative',
      severity: this.calculateSeverity(magnitude),
      nearbyLocations: this.findNearbyPrices(allPriceData, locationIndex, index, config.spatialRadius),
      confidence: Math.min(zScore / 5, 1), // Normalize confidence
      zScore
    };
  }

  /**
   * Calculate spike severity based on magnitude
   */
  calculateSeverity(magnitude) {
    if (magnitude > SEVERITY_THRESHOLDS.critical) return 'critical';
    if (magnitude > SEVERITY_THRESHOLDS.high) return 'high';
    if (magnitude > SEVERITY_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  /**
   * Find nearby price data for spatial analysis
   */
  findNearbyPrices(priceData, currentLocationIndex, timeIndex, radius) {
    const nearby = [];
    
    for (let i = 0; i < priceData.length; i++) {
      if (i !== currentLocationIndex && priceData[i].prices[timeIndex]) {
        // Distance calculation (simplified - in reality would use actual coordinates)
        const distance = Math.abs(i - currentLocationIndex) * 10;
        
        if (distance <= radius) {
          nearby.push({
            location: priceData[i].location,
            price: priceData[i].prices[timeIndex].price,
            distance
          });
        }
      }
    }
    
    return nearby.slice(0, 5); // Return top 5 nearby locations
  }

  /**
   * Filter duplicate spikes that are too close in time and space
   */
  filterDuplicateSpikes(spikes) {
    const filtered = [];
    const timeThreshold = 15 * 60 * 1000; // 15 minutes
    
    spikes.forEach(spike => {
      const isDuplicate = filtered.some(existing => 
        this.areSpikesDuplicate(existing, spike, timeThreshold)
      );
      
      if (!isDuplicate) {
        filtered.push(spike);
      }
    });
    
    return filtered.sort((a, b) => b.magnitude - a.magnitude);
  }

  /**
   * Check if two spikes are duplicates
   */
  areSpikesDuplicate(spike1, spike2, timeThreshold) {
    return spike1.location === spike2.location &&
           Math.abs(new Date(spike1.timestamp).getTime() - new Date(spike2.timestamp).getTime()) < timeThreshold;
  }

  /**
   * Generate grid events from detected spikes
   */
  generateGridEvents(spikes, date) {
    if (!spikes || spikes.length === 0) {
      logger.info('⚡ No spikes provided for grid event generation');
      return [];
    }

    try {
      const timeGroups = this.groupSpikesByTime(spikes);
      const events = this.createEventsFromTimeGroups(timeGroups, date);
      
      logger.info(`⚡ Generated ${events.length} grid events from spike patterns`);
      return events;
    } catch (error) {
      logger.error('❌ Grid event generation error:', error);
      throw new ApiError(`Failed to generate grid events: ${error.message}`, 500);
    }
  }

  /**
   * Group spikes by hour for event detection
   */
  groupSpikesByTime(spikes) {
    const timeGroups = new Map();
    
    spikes.forEach(spike => {
      const hour = new Date(spike.timestamp).getHours();
      if (!timeGroups.has(hour)) {
        timeGroups.set(hour, []);
      }
      timeGroups.get(hour).push(spike);
    });
    
    return timeGroups;
  }

  /**
   * Create grid events from time-grouped spikes
   */
  createEventsFromTimeGroups(timeGroups, date) {
    const events = [];
    
    timeGroups.forEach((hourSpikes, hour) => {
      if (hourSpikes.length >= 2) {
        const avgMagnitude = this.calculateAverageMagnitude(hourSpikes);
        
        events.push({
          id: `event-${hour}-${Date.now()}`,
          timestamp: `${date}T${hour.toString().padStart(2, '0')}:00:00Z`,
          type: avgMagnitude > 100 ? 'transmission_outage' : 'congestion',
          description: this.generateEventDescription(hourSpikes, avgMagnitude),
          affectedLocations: hourSpikes.map(s => s.location),
          estimatedImpact: avgMagnitude,
          severity: this.getEventSeverity(avgMagnitude),
          confidence: this.calculateEventConfidence(hourSpikes)
        });
      }
    });
    
    return events;
  }

  /**
   * Calculate average magnitude for a group of spikes
   */
  calculateAverageMagnitude(spikes) {
    return spikes.reduce((sum, s) => sum + s.magnitude, 0) / spikes.length;
  }

  /**
   * Get event severity based on magnitude
   */
  getEventSeverity(avgMagnitude) {
    if (avgMagnitude > 150) return 'high';
    if (avgMagnitude > 75) return 'medium';
    return 'low';
  }

  /**
   * Generate event description based on spike patterns
   */
  generateEventDescription(spikes, avgMagnitude) {
    const locations = spikes.map(s => s.location).join(', ');
    
    if (avgMagnitude > 150) {
      return `Major transmission outage affecting ${locations}. Price differential suggests line trip or generator failure.`;
    } else if (avgMagnitude > 75) {
      return `Transmission congestion detected at ${locations}. Possible line loading or constraint activation.`;
    } else {
      return `Minor grid disturbance observed at ${locations}. Localized supply-demand imbalance.`;
    }
  }

  /**
   * Calculate confidence level for grid events
   */
  calculateEventConfidence(spikes) {
    let confidence = 0.5;
    
    // Higher confidence for more spikes
    confidence += Math.min(spikes.length * 0.1, 0.3);
    
    // Higher confidence for higher magnitude spikes
    const avgMagnitude = this.calculateAverageMagnitude(spikes);
    confidence += Math.min(avgMagnitude / 200, 0.2);
    
    return Math.min(confidence, 0.95);
  }

  /**
   * AI-powered analysis using LangChain
   */
  async analyzeWithAI(spike, contextData) {
    this.validateAIAnalysisInputs(spike, contextData);

    try {
      logger.info(`🧠 Performing AI analysis on spike at ${spike.location} (${spike.magnitude} $/MWh)`);
      const analysis = await this.llmClient.analyzePriceSpike(spike, contextData);
      return analysis;
    } catch (error) {
      logger.error('❌ AI analysis error:', error.message);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(`AI analysis failed: ${error.message}`, 500);
    }
  }

  /**
   * Validate inputs for AI analysis
   */
  validateAIAnalysisInputs(spike, contextData) {
    if (!this.llmClient) {
      throw new ApiError('AI analysis requires LLM configuration. Please configure an AI provider.', 400);
    }

    if (!spike || typeof spike !== 'object') {
      throw new ApiError('Valid spike object is required for AI analysis', 400);
    }
  }

  /**
   * Analyze multiple spikes for grid events using AI
   */
  async analyzeGridEvents(spikes, date) {
    this.validateGridEventsInputs(spikes);

    try {
      logger.info(`🧠 Performing AI grid events analysis for ${spikes.length} spikes`);
      const analysis = await this.llmClient.analyzeGridEvents(spikes, date);
      return analysis;
    } catch (error) {
      logger.error('❌ Grid events analysis error:', error.message);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(`Grid events analysis failed: ${error.message}`, 500);
    }
  }

  /**
   * Validate inputs for grid events analysis
   */
  validateGridEventsInputs(spikes) {
    if (!this.llmClient) {
      throw new ApiError('Grid events analysis requires LLM configuration. Please configure an AI provider.', 400);
    }

    if (!spikes || spikes.length === 0) {
      throw new ApiError('Spikes data is required for grid events analysis', 400);
    }
  }

  /**
   * Get spike analysis statistics
   */
  getAnalysisStats(spikes) {
    this.validateStatsInput(spikes);

    try {
      const stats = {
        total: spikes.length,
        bySeverity: this.calculateSeverityStats(spikes),
        byType: this.calculateTypeStats(spikes),
        avgMagnitude: this.calculateAverageMagnitude(spikes),
        maxMagnitude: spikes.length > 0 ? Math.max(...spikes.map(s => s.magnitude)) : 0,
        avgConfidence: spikes.length > 0 
          ? spikes.reduce((sum, s) => sum + s.confidence, 0) / spikes.length 
          : 0
      };

      logger.info(`📈 Spike analysis stats: ${stats.total} total, ${stats.bySeverity.critical} critical`);
      return stats;
    } catch (error) {
      logger.error('❌ Statistics calculation error:', error);
      throw new ApiError(`Failed to calculate analysis statistics: ${error.message}`, 500);
    }
  }

  /**
   * Validate input for statistics calculation
   */
  validateStatsInput(spikes) {
    if (!spikes || !Array.isArray(spikes)) {
      throw new ApiError('Valid spikes array is required for statistics calculation', 400);
    }
  }

  /**
   * Calculate severity distribution statistics
   */
  calculateSeverityStats(spikes) {
    return {
      critical: spikes.filter(s => s.severity === 'critical').length,
      high: spikes.filter(s => s.severity === 'high').length,
      medium: spikes.filter(s => s.severity === 'medium').length,
      low: spikes.filter(s => s.severity === 'low').length
    };
  }

  /**
   * Calculate type distribution statistics
   */
  calculateTypeStats(spikes) {
    return {
      positive: spikes.filter(s => s.type === 'positive').length,
      negative: spikes.filter(s => s.type === 'negative').length
    };
  }
}

export default SpikeAnalyzer;