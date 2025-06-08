import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initializeServices } from './config/services.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Initialize services
    await initializeServices();
    
    // Create Express app
    const app = createApp();
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Virtual Energy Trader API running on port ${PORT}`);
      logger.info(`📊 Environment: ${NODE_ENV}`);
      logger.info(`🔧 GridStatus API: ${process.env.GRIDSTATUS_API_KEY ? 'Configured' : 'Not configured'}`);
      
      // Log available AI providers
      const aiProviders = {
        google: !!process.env.GOOGLE_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        together: !!process.env.TOGETHER_API_KEY
      };
      const enabledProviders = Object.entries(aiProviders)
        .filter(([, enabled]) => enabled)
        .map(([provider]) => provider);
      
      logger.info(`🤖 AI Providers: ${enabledProviders.length > 0 ? enabledProviders.join(', ') : 'None configured'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`📴 Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('✅ Server closed successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();