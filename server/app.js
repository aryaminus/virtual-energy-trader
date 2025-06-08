import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

// Import route modules
import marketRoutes from './routes/market.js';
import tradingRoutes from './routes/trading.js';
import analysisRoutes from './routes/analysis.js';
import healthRoutes from './routes/health.js';
import cacheRoutes from './routes/cache.js';

/**
 * Root route handler
 */
const rootHandler = (req, res) => {
  res.json({
    name: 'Virtual Energy Trader API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      market: '/api/market',
      trading: '/api/trading',
      analysis: '/api/analysis',
      cache: '/api/cache'
    },
    documentation: 'https://github.com/your-repo/virtual-energy-trader'
  });
};

/**
 * Create and configure Express application
 * @returns {express.Application} Configured Express app
 */
export const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
  }));

  // Compression middleware
  app.use(compression());

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : true,
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Root route
  app.get('/', rootHandler);

  // API routes
  app.use('/api/market', marketRoutes);
  app.use('/api/trading', tradingRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/cache', cacheRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};