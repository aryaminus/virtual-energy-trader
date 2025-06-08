import { Router } from 'express';
import { simulateTrades } from '../controllers/tradingController.js';
import { validateTradeSimulation } from '../middleware/validation.js';

const router = Router();

/**
 * @route POST /api/trading/simulate
 * @desc Simulate trading with user bids
 * @access Public
 */
router.post('/simulate',
  validateTradeSimulation,
  simulateTrades
);

export default router;