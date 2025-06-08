/**
 * Timezone utility functions for handling user timezone conversions
 */

/**
 * Convert a date to a specific timezone
 * @param {Date|string} date - Date to convert
 * @param {string} timezone - Target timezone (e.g., 'America/New_York')
 * @returns {Date} Date object in the target timezone
 */
export const convertToTimezone = (date, timezone) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get the date string in the target timezone
  const dateString = dateObj.toLocaleString('sv-SE', { timeZone: timezone });
  
  // Create a new date object (this will be in local time but represents the target timezone)
  return new Date(dateString);
};

/**
 * Get date range for a specific date in user's timezone
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} userTimezone - User's timezone
 * @returns {Object} Start and end times in user's timezone
 */
export const getDateRangeInUserTimezone = (date, userTimezone) => {
  // Create start and end of day in user's timezone
  const startTime = new Date(`${date}T00:00:00`);
  const endTime = new Date(`${date}T23:59:59`);
  
  // Convert to user's timezone
  const userStartTime = convertToTimezone(startTime, userTimezone);
  const userEndTime = convertToTimezone(endTime, userTimezone);
  
  return {
    startTime: userStartTime.toISOString(),
    endTime: userEndTime.toISOString(),
    timezone: userTimezone
  };
};

/**
 * Convert Pacific Time hour to user's timezone hour
 * @param {number} pacificHour - Hour in Pacific Time (0-23)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} userTimezone - User's timezone
 * @returns {number} Hour in user's timezone
 */
export const convertPacificHourToUserTimezone = (pacificHour, date, userTimezone) => {
  // Create a date object for the Pacific Time hour
  const pacificDate = new Date(`${date}T${pacificHour.toString().padStart(2, '0')}:00:00`);
  
  // Convert from Pacific Time to UTC first
  const pacificTimeString = pacificDate.toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' });
  const utcDate = new Date(pacificTimeString + 'Z');
  
  // Then convert to user's timezone
  const userDate = convertToTimezone(utcDate, userTimezone);
  
  return userDate.getHours();
};

/**
 * Convert user timezone hour to Pacific Time hour
 * @param {number} userHour - Hour in user's timezone (0-23)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} userTimezone - User's timezone
 * @returns {number} Hour in Pacific Time
 */
export const convertUserHourToPacificTime = (userHour, date, userTimezone) => {
  // Create a date object for the user's timezone hour
  const userDate = new Date(`${date}T${userHour.toString().padStart(2, '0')}:00:00`);
  
  // Convert from user's timezone to UTC first
  const userTimeString = userDate.toLocaleString('sv-SE', { timeZone: userTimezone });
  const utcDate = new Date(userTimeString + 'Z');
  
  // Then convert to Pacific Time
  const pacificDate = convertToTimezone(utcDate, 'America/Los_Angeles');
  
  return pacificDate.getHours();
};

/**
 * Get current time in user's timezone
 * @param {string} userTimezone - User's timezone
 * @returns {Date} Current time in user's timezone
 */
export const getCurrentTimeInUserTimezone = (userTimezone) => {
  return convertToTimezone(new Date(), userTimezone);
};

/**
 * Check if a date is today in user's timezone
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {string} userTimezone - User's timezone
 * @returns {boolean} True if the date is today in user's timezone
 */
export const isTodayInUserTimezone = (dateString, userTimezone) => {
  const today = getCurrentTimeInUserTimezone(userTimezone);
  const checkDate = convertToTimezone(new Date(dateString + 'T00:00:00'), userTimezone);
  
  return today.toDateString() === checkDate.toDateString();
};

/**
 * Format timestamp for display in user's timezone
 * @param {string} timestamp - ISO timestamp
 * @param {string} userTimezone - User's timezone
 * @returns {string} Formatted timestamp
 */
export const formatTimestampInUserTimezone = (timestamp, userTimezone) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', { 
    timeZone: userTimezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};