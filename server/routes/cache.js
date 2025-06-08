import { Router } from 'express';
import { getCacheStats, clearCache } from '../controllers/cacheController.js';

const router = Router();

/**
 * @route GET /api/cache/stats
 * @desc Get cache statistics
 * @access Public
 */
router.get('/stats', getCacheStats);

/**
 * @route DELETE /api/cache
 * @desc Clear cache
 * @access Public
 */
router.delete('/', clearCache);

export default router;