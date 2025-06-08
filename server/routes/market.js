import { Router } from 'express';
import { getMarketData, getAvailableDatasets } from '../controllers/marketController.js';
import { validateDateParam, validateISOQuery } from '../middleware/validation.js';

const router = Router();

/**
 * @route GET /api/market/data/:date
 * @desc Get market data for a specific date
 * @access Public
 */
router.get('/data/:date', 
  validateDateParam,
  validateISOQuery,
  getMarketData
);

/**
 * @route GET /api/market/datasets
 * @desc Get available datasets from GridStatus API
 * @access Public
 */
router.get('/datasets', getAvailableDatasets);

export default router;