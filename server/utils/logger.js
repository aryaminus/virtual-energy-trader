/**
 * Simple logger utility with different log levels
 */
class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = process.env.LOG_LEVEL || 'info';
  }

  /**
   * Format log message with timestamp and level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  /**
   * Check if log level should be output
   * @param {string} level - Log level to check
   * @returns {boolean}
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.currentLevel];
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object|Error} [meta] - Additional metadata or error object
   */
  error(message, meta = {}) {
    if (!this.shouldLog('error')) return;
    
    if (meta instanceof Error) {
      meta = { error: meta.message, stack: meta.stack };
    }
    
    console.error(this.formatMessage('error', message, meta));
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} [meta] - Additional metadata
   */
  warn(message, meta = {}) {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, meta));
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} [meta] - Additional metadata
   */
  info(message, meta = {}) {
    if (!this.shouldLog('info')) return;
    console.log(this.formatMessage('info', message, meta));
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} [meta] - Additional metadata
   */
  debug(message, meta = {}) {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatMessage('debug', message, meta));
  }
}

export const logger = new Logger();