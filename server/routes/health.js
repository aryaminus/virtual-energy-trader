import { Router } from 'express';
import { getHealthStatus } from '../controllers/healthController.js';

const router = Router();

/**
 * @route GET /api/health
 * @desc Get system health status
 * @access Public
 */
router.get('/', getHealthStatus);

export default router;