import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Validate date parameter format (YYYY-MM-DD)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateDateParam = (req, res, next) => {
  const { date } = req.params;
  
  if (!date) {
    return next(new ApiError('Date parameter is required', 400));
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return next(new ApiError('Invalid date format. Expected YYYY-MM-DD', 400));
  }
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return next(new ApiError('Invalid date value', 400));
  }
  
  // Check if date is not too far in the future
  const today = new Date();
  const maxDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (parsedDate > maxDate) {
    return next(new ApiError('Date is too far in the future', 400));
  }
  
  next();
};

/**
 * Validate ISO query parameter
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateISOQuery = (req, res, next) => {
  const { iso } = req.query;
  
  if (iso) {
    const validISOs = ['CAISO', 'ERCOT', 'ISONE', 'MISO', 'NYISO', 'PJM', 'SPP'];
    if (!validISOs.includes(iso.toUpperCase())) {
      return next(new ApiError(`Invalid ISO: ${iso}. Valid ISOs are: ${validISOs.join(', ')}`, 400));
    }
    req.query.iso = iso.toUpperCase();
  }
  
  next();
};

/**
 * Validate trade simulation request body
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateTradeSimulation = (req, res, next) => {
  const { bids, date } = req.body;
  
  if (!bids || !Array.isArray(bids) || bids.length === 0) {
    return next(new ApiError('Bids array is required and must not be empty', 400));
  }
  
  if (!date) {
    return next(new ApiError('Date is required', 400));
  }
  
  // Validate each bid
  for (let i = 0; i < bids.length; i++) {
    const bid = bids[i];
    
    if (!bid.id || typeof bid.id !== 'string') {
      return next(new ApiError(`Bid ${i}: id is required and must be a string`, 400));
    }
    
    if (typeof bid.hour !== 'number' || bid.hour < 0 || bid.hour > 23) {
      return next(new ApiError(`Bid ${i}: hour must be a number between 0 and 23`, 400));
    }
    
    if (!['buy', 'sell'].includes(bid.type)) {
      return next(new ApiError(`Bid ${i}: type must be 'buy' or 'sell'`, 400));
    }
    
    if (typeof bid.price !== 'number' || bid.price < 0) {
      return next(new ApiError(`Bid ${i}: price must be a positive number`, 400));
    }
    
    if (typeof bid.quantity !== 'number' || bid.quantity <= 0) {
      return next(new ApiError(`Bid ${i}: quantity must be a positive number`, 400));
    }
  }
  
  next();
};

/**
 * Validate spike analysis request body
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateSpikeAnalysis = (req, res, next) => {
  const { analysisType, thresholds } = req.body;
  
  if (analysisType && !['detection', 'correlation', 'prediction'].includes(analysisType)) {
    return next(new ApiError('Invalid analysis type. Must be: detection, correlation, or prediction', 400));
  }
  
  if (thresholds && typeof thresholds !== 'object') {
    return next(new ApiError('Thresholds must be an object', 400));
  }
  
  next();
};

/**
 * Validate AI analysis request body
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateAIAnalysis = (req, res, next) => {
  const { spike, contextData, llmConfig } = req.body;
  
  if (!spike || typeof spike !== 'object') {
    return next(new ApiError('Spike object is required', 400));
  }
  
  if (!contextData || typeof contextData !== 'object') {
    return next(new ApiError('Context data object is required', 400));
  }
  
  if (!llmConfig || typeof llmConfig !== 'object') {
    return next(new ApiError('LLM configuration object is required', 400));
  }
  
  if (!llmConfig.provider || typeof llmConfig.provider !== 'string') {
    return next(new ApiError('LLM provider is required', 400));
  }
  
  if (!llmConfig.model || typeof llmConfig.model !== 'string') {
    return next(new ApiError('LLM model is required', 400));
  }
  
  next();
};

