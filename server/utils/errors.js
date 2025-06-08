/**
 * Custom API Error class for structured error handling
 */
export class ApiError extends Error {
  /**
   * Create an API error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [details] - Additional error details
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a validation error
 * @param {string} message - Error message
 * @param {string} [details] - Additional details
 * @returns {ApiError}
 */
export const createValidationError = (message, details = null) => {
  return new ApiError(message, 400, details);
};

/**
 * Create a not found error
 * @param {string} resource - Resource that was not found
 * @returns {ApiError}
 */
export const createNotFoundError = (resource = 'Resource') => {
  return new ApiError(`${resource} not found`, 404);
};

/**
 * Create an unauthorized error
 * @param {string} [message] - Custom error message
 * @returns {ApiError}
 */
export const createUnauthorizedError = (message = 'Unauthorized access') => {
  return new ApiError(message, 401);
};

/**
 * Create a forbidden error
 * @param {string} [message] - Custom error message
 * @returns {ApiError}
 */
export const createForbiddenError = (message = 'Access forbidden') => {
  return new ApiError(message, 403);
};

/**
 * Create a rate limit error
 * @param {string} [message] - Custom error message
 * @returns {ApiError}
 */
export const createRateLimitError = (message = 'Rate limit exceeded') => {
  return new ApiError(message, 429);
};

/**
 * Create an internal server error
 * @param {string} [message] - Custom error message
 * @param {string} [details] - Additional details
 * @returns {ApiError}
 */
export const createInternalError = (message = 'Internal server error', details = null) => {
  return new ApiError(message, 500, details);
};