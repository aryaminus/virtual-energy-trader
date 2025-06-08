import { logger } from './logger.js';
import { ApiError } from './errors.js';
import { convertPacificHourToUserTimezone } from './timezone.js';

/**
 * Market data utilities - handles GridStatus data transformation
 * Server processes data in Pacific Time, then converts to user's timezone
 */

/**
 * Convert timestamp to Pacific Time hour
 * @param {string} timestamp - ISO timestamp string
 * @returns {number} Hour in Pacific Time (0-23)
 */
const getPacificTimeHour = (timestamp) => {
  const date = new Date(timestamp);
  // Convert to Pacific Time and get hour
  const pacificTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  return pacificTime.getHours();
};

/**
 * Convert timestamp to Pacific Time for consistent processing
 * @param {string} timestamp - ISO timestamp string
 * @returns {Date} Date object in Pacific Time
 */
const toPacificTime = (timestamp) => {
  const date = new Date(timestamp);
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
};

/**
 * Transform GridStatus API data to our internal format with timezone conversion
 * @param {Array} dayAheadData - Raw day-ahead data from GridStatus API
 * @param {Array} realTimeData - Raw real-time data from GridStatus API
 * @param {string} userTimezone - User's timezone for conversion
 * @param {string} date - Date being processed
 * @returns {Object} Transformed market data in user's timezone
 */
export const transformGridStatusData = (dayAheadData, realTimeData, userTimezone = 'America/Los_Angeles', date = null) => {
  logger.info(`🔄 Transforming ${dayAheadData.length} day-ahead and ${realTimeData.length} real-time records for timezone: ${userTimezone}`);
  
  // Track data quality for metadata
  const actualHours = [];
  const interpolatedHours = [];
  const fallbackHours = [];
  
  // Log sample records to understand the data structure
  if (dayAheadData.length > 0) {
    logger.info(`📋 Sample day-ahead record: ${JSON.stringify(dayAheadData[0])}`);
    logger.info(`📋 Day-ahead data keys: ${Object.keys(dayAheadData[0]).join(', ')}`);
  }
  
  if (realTimeData.length > 0) {
    logger.info(`📋 Sample real-time record: ${JSON.stringify(realTimeData[0])}`);
    logger.info(`📋 Real-time data keys: ${Object.keys(realTimeData[0]).join(', ')}`);
  }

  // Transform day-ahead prices using Pacific Time first, then convert to user timezone
  const dayAheadPrices = [];
  const hourlyData = {};
  
  // Process day-ahead data in Pacific Time
  dayAheadData.forEach((item, index) => {
    try {
      // Validate item structure
      if (!item || typeof item !== 'object') {
        logger.warn(`⚠️  Skipping invalid item at index ${index}: not an object`);
        return;
      }
      
      const timestamp = item.interval_start_utc || item.interval_start_local || item.timestamp || item.datetime || item.time || item.interval_start;
      const price = parseFloat(item.lmp || item.price || item.energy_price || item.da_lmp || item.rt_lmp || 0);
      
      // Validate timestamp and price
      if (!timestamp || typeof timestamp !== 'string') {
        logger.debug(`⚠️  Skipping item ${index}: invalid timestamp`);
        return;
      }
      
      if (isNaN(price) || price <= 0 || price > 10000) {
        logger.debug(`⚠️  Skipping item ${index}: invalid price (${price})`);
        return;
      }
      
      // Use Pacific Time for hour calculation (data source timezone)
      const pacificHour = getPacificTimeHour(timestamp);
      
      if (pacificHour < 0 || pacificHour > 23) {
        logger.warn(`⚠️  Invalid hour extracted: ${pacificHour} from timestamp ${timestamp}`);
        return;
      }
      
      if (!hourlyData[pacificHour]) {
        hourlyData[pacificHour] = { prices: [], timestamp, count: 0 };
      }
      hourlyData[pacificHour].prices.push(price);
      hourlyData[pacificHour].count++;
    } catch (error) {
      logger.warn(`⚠️  Error processing day-ahead item ${index}: ${error.message}`);
    }
  });
  
  logger.info(`📊 Grouped day-ahead data into ${Object.keys(hourlyData).length} Pacific Time hours: [${Object.keys(hourlyData).sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}]`);
  
  // Log hourly data summary
  Object.entries(hourlyData).forEach(([hour, data]) => {
    const avgPrice = data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length;
    const minPrice = Math.min(...data.prices);
    const maxPrice = Math.max(...data.prices);
    logger.info(`📊 DA Hour ${hour} (PT): ${data.count} records, avg: $${avgPrice.toFixed(2)}, range: $${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}`);
  });
  
  // Create 24-hour day-ahead price array in user's timezone
  for (let userHour = 0; userHour < 24; userHour++) {
    // Convert user hour to Pacific Time to find the data
    let pacificHour = userHour;
    if (date && userTimezone !== 'America/Los_Angeles') {
      try {
        // More robust timezone conversion using actual date
        const testDate = new Date(`${date}T${userHour.toString().padStart(2, '0')}:00:00`);
        const userTime = new Date(testDate.toLocaleString('en-US', { timeZone: userTimezone }));
        const pacificTime = new Date(testDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
        
        // Calculate hour difference
        const hourDiff = Math.round((userTime.getTime() - pacificTime.getTime()) / (1000 * 60 * 60));
        pacificHour = (userHour - hourDiff + 24) % 24;
      } catch (error) {
        logger.warn(`⚠️  Timezone conversion error for hour ${userHour}: ${error.message}`);
        // Fallback to no conversion if timezone parsing fails
        pacificHour = userHour;
      }
    }
    
    if (hourlyData[pacificHour] && hourlyData[pacificHour].prices.length > 0) {
      const avgPrice = hourlyData[pacificHour].prices.reduce((sum, p) => sum + p, 0) / hourlyData[pacificHour].prices.length;
      actualHours.push(userHour);
      dayAheadPrices.push({
        hour: userHour, // User's local hour
        price: avgPrice,
        timestamp: hourlyData[pacificHour].timestamp,
        dataQuality: 'actual',
        recordCount: hourlyData[pacificHour].prices.length,
        sourceHour: pacificHour // Keep track of source Pacific Time hour
      });
      logger.info(`✅ DA Hour ${userHour} (${userTimezone}): $${avgPrice.toFixed(2)} (from PT hour ${pacificHour}, ${hourlyData[pacificHour].prices.length} records)`);
    } else {
      // Handle missing hours with interpolation or fallback
      let interpolatedPrice = 50; // Default fallback
      let dataQuality = 'fallback';
      
      // Try to interpolate from adjacent hours
      const prevHour = dayAheadPrices[dayAheadPrices.length - 1];
      const nextPacificHour = (pacificHour + 1) % 24;
      const nextHourData = hourlyData[nextPacificHour];
      
      if (prevHour && nextHourData && nextHourData.prices.length > 0) {
        const nextPrice = nextHourData.prices.reduce((sum, p) => sum + p, 0) / nextHourData.prices.length;
        interpolatedPrice = (prevHour.price + nextPrice) / 2;
        dataQuality = 'interpolated';
        interpolatedHours.push(userHour);
      } else if (prevHour) {
        interpolatedPrice = prevHour.price;
        dataQuality = 'interpolated';
        interpolatedHours.push(userHour);
      } else if (nextHourData && nextHourData.prices.length > 0) {
        interpolatedPrice = nextHourData.prices.reduce((sum, p) => sum + p, 0) / nextHourData.prices.length;
        dataQuality = 'interpolated';
        interpolatedHours.push(userHour);
      } else {
        fallbackHours.push(userHour);
      }
      
      dayAheadPrices.push({
        hour: userHour,
        price: interpolatedPrice,
        timestamp: new Date().toISOString(),
        dataQuality,
        recordCount: 0,
        sourceHour: pacificHour
      });
      
      logger.warn(`⚠️  Missing day-ahead data for hour ${userHour} (${userTimezone}), using ${dataQuality} price: $${interpolatedPrice.toFixed(2)}`);
    }
  }

  // Transform real-time data using similar timezone conversion
  const realTimePrices = [];
  const hourlyRTData = {};
  
  // Process real-time data in Pacific Time
  realTimeData.forEach((item, index) => {
    try {
      // Validate item structure
      if (!item || typeof item !== 'object') {
        logger.warn(`⚠️  Skipping invalid RT item at index ${index}: not an object`);
        return;
      }
      
      const timestamp = item.interval_start_utc || item.interval_start_local || item.timestamp || item.datetime || item.time || item.interval_start;
      const price = parseFloat(item.lmp || item.price || item.energy_price || item.da_lmp || item.rt_lmp || 0);
      
      // Validate timestamp and price
      if (!timestamp || typeof timestamp !== 'string') {
        logger.debug(`⚠️  Skipping RT item ${index}: invalid timestamp`);
        return;
      }
      
      if (isNaN(price) || price <= 0 || price > 10000) {
        logger.debug(`⚠️  Skipping RT item ${index}: invalid price (${price})`);
        return;
      }
      
      // Use Pacific Time for hour and minute calculation
      const pacificTime = toPacificTime(timestamp);
      const pacificHour = pacificTime.getHours();
      const minute = pacificTime.getMinutes();
      
      if (pacificHour < 0 || pacificHour > 23) {
        logger.warn(`⚠️  Invalid RT hour extracted: ${pacificHour} from timestamp ${timestamp}`);
        return;
      }
      
      if (minute < 0 || minute > 59) {
        logger.warn(`⚠️  Invalid minute extracted: ${minute} from timestamp ${timestamp}`);
        return;
      }
      
      if (!hourlyRTData[pacificHour]) {
        hourlyRTData[pacificHour] = [];
      }
      
      hourlyRTData[pacificHour].push({
        interval: Math.floor(minute / 15), // 15-minute intervals
        price,
        timestamp,
        minute
      });
    } catch (error) {
      logger.warn(`⚠️  Error processing RT item ${index}: ${error.message}`);
    }
  });
  
  logger.info(`📊 Grouped real-time data into ${Object.keys(hourlyRTData).length} Pacific Time hours`);
  
  // Log real-time hourly data summary
  Object.entries(hourlyRTData).forEach(([hour, data]) => {
    const avgPrice = data.reduce((sum, p) => sum + p.price, 0) / data.length;
    const minPrice = Math.min(...data.map(p => p.price));
    const maxPrice = Math.max(...data.map(p => p.price));
    logger.info(`📊 RT Hour ${hour} (PT): ${data.length} records, avg: $${avgPrice.toFixed(2)}, range: $${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}`);
  });
  
  // Create 24-hour real-time price array in user's timezone
  for (let userHour = 0; userHour < 24; userHour++) {
    // Convert user hour to Pacific Time to find the data
    let pacificHour = userHour;
    if (date && userTimezone !== 'America/Los_Angeles') {
      try {
        // More robust timezone conversion using actual date
        const testDate = new Date(`${date}T${userHour.toString().padStart(2, '0')}:00:00`);
        const userTime = new Date(testDate.toLocaleString('en-US', { timeZone: userTimezone }));
        const pacificTime = new Date(testDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
        
        // Calculate hour difference
        const hourDiff = Math.round((userTime.getTime() - pacificTime.getTime()) / (1000 * 60 * 60));
        pacificHour = (userHour - hourDiff + 24) % 24;
      } catch (error) {
        logger.warn(`⚠️  RT Timezone conversion error for hour ${userHour}: ${error.message}`);
        // Fallback to no conversion if timezone parsing fails
        pacificHour = userHour;
      }
    }
    
    const hourData = hourlyRTData[pacificHour] || [];
    
    if (hourData.length === 0) {
      // Use day-ahead price as fallback for missing real-time data
      const daPrice = dayAheadPrices.find(da => da.hour === userHour)?.price || 50;
      const fallbackPrices = [];
      
      // Create 4 intervals for 15-minute data
      for (let interval = 0; interval < 4; interval++) {
        fallbackPrices.push({
          interval,
          price: daPrice + (Math.random() - 0.5) * 5, // Add small variance
          timestamp: new Date().toISOString(),
          dataQuality: 'fallback'
        });
      }
      
      realTimePrices.push({ 
        hour: userHour, 
        prices: fallbackPrices,
        dataQuality: 'fallback',
        recordCount: 0,
        sourceHour: pacificHour
      });
      logger.warn(`⚠️  Missing real-time data for hour ${userHour} (${userTimezone}), using fallback based on day-ahead: $${daPrice.toFixed(2)}`);
      continue;
    }
    
    // Group by 15-minute intervals and average prices within each interval
    const intervalData = {};
    hourData.forEach(item => {
      if (!intervalData[item.interval]) {
        intervalData[item.interval] = [];
      }
      intervalData[item.interval].push(item.price);
    });
    
    // Create 4 intervals per hour
    const prices = [];
    let hasActualData = false;
    for (let interval = 0; interval < 4; interval++) {
      if (intervalData[interval] && intervalData[interval].length > 0) {
        const avgPrice = intervalData[interval].reduce((sum, p) => sum + p, 0) / intervalData[interval].length;
        hasActualData = true;
        prices.push({
          interval,
          price: avgPrice,
          timestamp: new Date().toISOString(),
          dataQuality: 'actual'
        });
      } else {
        // Use average of all data for this hour if specific interval is missing
        const avgPrice = hourData.reduce((sum, item) => sum + item.price, 0) / hourData.length;
        prices.push({
          interval,
          price: avgPrice,
          timestamp: new Date().toISOString(),
          dataQuality: 'fallback'
        });
      }
    }
    
    const dataQuality = hasActualData ? 
      (prices.every(p => p.dataQuality === 'actual') ? 'actual' : 'partial') : 
      'fallback';
    
    realTimePrices.push({ 
      hour: userHour, 
      prices,
      dataQuality,
      recordCount: hourData.length,
      sourceHour: pacificHour
    });
  }

  // Validate we have complete data
  if (dayAheadPrices.length !== 24) {
    logger.warn(`⚠️  Incomplete day-ahead data: ${dayAheadPrices.length}/24 hours`);
  }
  
  if (realTimePrices.length !== 24) {
    logger.warn(`⚠️  Incomplete real-time data: ${realTimePrices.length}/24 hours`);
  }

  logger.info(`✅ Successfully transformed data to ${userTimezone}: ${dayAheadPrices.length} DA hours, ${realTimePrices.length} RT hours`);
  
  // Log final summary
  const avgDAPrice = dayAheadPrices.reduce((sum, p) => sum + p.price, 0) / dayAheadPrices.length;
  const allRTPrices = realTimePrices.flatMap(h => h.prices.map(p => p.price));
  const avgRTPrice = allRTPrices.reduce((sum, p) => sum + p, 0) / allRTPrices.length;
  logger.info(`📊 Final averages (${userTimezone}): DA=$${avgDAPrice.toFixed(2)}, RT=$${avgRTPrice.toFixed(2)}, Spread=$${(avgRTPrice - avgDAPrice).toFixed(2)}`);
  
  // Final data quality summary
  logger.info(`📊 Final data quality summary: Actual=${actualHours.length}, Interpolated=${interpolatedHours.length}, Fallback=${fallbackHours.length}`);
  logger.info(`📊 Actual hours: [${actualHours.sort((a, b) => a - b).join(', ')}]`);
  logger.info(`📊 Interpolated hours: [${interpolatedHours.sort((a, b) => a - b).join(', ')}]`);
  logger.info(`📊 Fallback hours: [${fallbackHours.sort((a, b) => a - b).join(', ')}]`);

  return { 
    dayAheadPrices, 
    realTimePrices,
    metadata: {
      actualHours,
      interpolatedHours,
      fallbackHours,
      totalRecords: {
        dayAhead: dayAheadData.length,
        realTime: realTimeData.length
      },
      dataSource: 'gridstatus',
      timezone: userTimezone,
      sourceTimezone: 'America/Los_Angeles'
    }
  };
};

/**
 * Transform raw GridStatus API data to spike analysis format
 * @param {Array} rawData - Raw data from GridStatus API
 * @param {string} userTimezone - User's timezone for conversion
 * @returns {Array} Array of LocationPriceData objects for spike analysis
 */
export const transformGridStatusRawToSpikeAnalysisFormat = (rawData, userTimezone = 'America/Los_Angeles') => {
  if (!rawData || rawData.length === 0) {
    throw new ApiError('No raw data provided for transformation', 400);
  }
  
  logger.info(`🔄 Transforming spike analysis data for timezone: ${userTimezone}`);
  
  // Group data by location/node
  const locationGroups = {};
  
  rawData.forEach(item => {
    // Handle different possible field names for location/node
    const location = item.pnode || item.location || item.node || item.zone || 'UNKNOWN';
    const timestamp = item.interval_start_utc || item.interval_start_local || item.timestamp || item.datetime;
    const price = parseFloat(item.lmp || item.price || 0);
    
    if (!locationGroups[location]) {
      locationGroups[location] = [];
    }
    
    if (timestamp) {
      // Convert timestamp to user's timezone
      let convertedTimestamp = timestamp;
      if (userTimezone !== 'America/Los_Angeles') {
        try {
          const date = new Date(timestamp);
          convertedTimestamp = date.toLocaleString('sv-SE', { timeZone: userTimezone }).replace(' ', 'T') + 'Z';
        } catch (error) {
          logger.warn(`⚠️  Timezone conversion error for timestamp ${timestamp}: ${error.message}`);
        }
      }
      
      locationGroups[location].push({
        price,
        timestamp: convertedTimestamp
      });
    }
  });
  
  // Convert to LocationPriceData format
  const locationPriceData = [];
  
  Object.entries(locationGroups).forEach(([location, prices]) => {
    if (prices.length > 0) {
      // Sort prices by timestamp
      prices.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      locationPriceData.push({
        location,
        prices,
        metadata: {
          region: getLocationRegion(location),
          type: getLocationType(location),
          source: 'gridstatus',
          dataPoints: prices.length,
          timeRange: {
            start: prices[0].timestamp,
            end: prices[prices.length - 1].timestamp
          },
          timezone: userTimezone
        }
      });
    }
  });
  
  if (locationPriceData.length === 0) {
    throw new ApiError('No valid location price data could be extracted from GridStatus response', 404);
  }
  
  logger.info(`✅ Transformed ${locationPriceData.length} locations for spike analysis in ${userTimezone}`);
  
  return locationPriceData;
};

/**
 * Get region for a location based on common naming patterns
 * @param {string} location - Location name
 * @returns {string} Region name
 */
const getLocationRegion = (location) => {
  const locationUpper = location.toUpperCase();
  
  if (locationUpper.includes('SP15') || locationUpper.includes('SCE') || locationUpper.includes('SDGE')) {
    return 'Southern California';
  }
  if (locationUpper.includes('NP15') || locationUpper.includes('PGE')) {
    return 'Northern California';
  }
  if (locationUpper.includes('ZP26')) {
    return 'Central Valley';
  }
  if (locationUpper.includes('DLAP')) {
    return 'Distribution Load Aggregation Point';
  }
  
  // Try to infer from common patterns
  if (locationUpper.includes('LA') || locationUpper.includes('ANGELES')) {
    return 'Los Angeles Basin';
  }
  if (locationUpper.includes('SF') || locationUpper.includes('BAY')) {
    return 'San Francisco Bay Area';
  }
  if (locationUpper.includes('SD') || locationUpper.includes('DIEGO')) {
    return 'San Diego';
  }
  
  return 'California ISO';
};

/**
 * Get location type based on naming patterns
 * @param {string} location - Location name
 * @returns {string} Location type
 */
const getLocationType = (location) => {
  const locationUpper = location.toUpperCase();
  
  if (locationUpper.includes('DLAP')) return 'Load Zone';
  if (locationUpper.includes('GEN')) return 'Generation Zone';
  if (locationUpper.includes('ASR')) return 'Ancillary Services Region';
  if (locationUpper.includes('HUB')) return 'Trading Hub';
  if (locationUpper.includes('ZONE')) return 'Price Zone';
  if (locationUpper.includes('NODE')) return 'Price Node';
  
  return 'Trading Hub';
};

/**
 * Calculate market statistics from price data
 * @param {Array} dayAheadPrices - Day-ahead price data
 * @param {Array} realTimePrices - Real-time price data
 * @returns {Object} Market statistics
 */
export const calculateMarketStats = (dayAheadPrices, realTimePrices) => {
  if (!dayAheadPrices || dayAheadPrices.length === 0) {
    throw new ApiError('Day-ahead prices are required for market statistics calculation', 400);
  }
  
  if (!realTimePrices || realTimePrices.length === 0) {
    throw new ApiError('Real-time prices are required for market statistics calculation', 400);
  }
  
  const avgDA = dayAheadPrices.reduce((sum, d) => sum + d.price, 0) / dayAheadPrices.length;
  
  const allRtPrices = realTimePrices.flatMap(hour => hour.prices.map(p => p.price));
  const avgRT = allRtPrices.reduce((sum, p) => sum + p, 0) / allRtPrices.length;
  
  const spreads = dayAheadPrices.map(da => {
    const rtHour = realTimePrices.find(rt => rt.hour === da.hour);
    const avgRtPrice = rtHour 
      ? rtHour.prices.reduce((sum, p) => sum + p.price, 0) / rtHour.prices.length
      : 0;
    return avgRtPrice - da.price;
  });
  
  const maxSpread = Math.max(...spreads);
  const minSpread = Math.min(...spreads);
  
  return {
    avgDayAhead: avgDA,
    avgRealTime: avgRT,
    maxSpread,
    minSpread,
    volatility: Math.sqrt(spreads.reduce((sum, s) => sum + s * s, 0) / spreads.length)
  };
};