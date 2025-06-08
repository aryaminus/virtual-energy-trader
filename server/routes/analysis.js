import { Router } from 'express';
import { 
  getAIProviders, 
  analyzeSpikes, 
  performAIAnalysis 
} from '../controllers/analysisController.js';
import { 
  validateDateParam, 
  validateSpikeAnalysis, 
  validateAIAnalysis 
} from '../middleware/validation.js';

const router = Router();

/**
 * @route GET /api/analysis/ai-providers
 * @desc Get available AI providers
 * @access Public
 */
router.get('/ai-providers', getAIProviders);

/**
 * @route POST /api/analysis/spikes/:date
 * @desc Analyze price spikes for a specific date
 * @access Public
 */
router.post('/spikes/:date',
  validateDateParam,
  validateSpikeAnalysis,
  analyzeSpikes
);

/**
 * @route POST /api/analysis/ai
 * @desc Perform AI analysis on a price spike
 * @access Public
 */
router.post('/ai',
  validateAIAnalysis,
  performAIAnalysis
);

export default router;