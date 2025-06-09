import { createApp } from "../../server/app.js";
import { initializeServices } from "../../server/config/services.js";
import { logger } from "../../server/utils/logger.js";
import serverless from "serverless-http";

// Cache the Express app instance
let expressApp = null;
let netlifyHandler = null;
let servicesInitialized = false;

/**
 * Initialize Express app and create serverless handler (cached)
 */
const getNetlifyHandler = async () => {
  if (netlifyHandler && servicesInitialized) {
    return netlifyHandler;
  }
  
  try {
    logger.info('🔧 Initializing Express app for Netlify with serverless-http...');
    
    // Initialize services first
    await initializeServices();
    
    // Create Express app
    expressApp = createApp();
    
    // Wrap Express app with serverless-http
    netlifyHandler = serverless(expressApp);
    
    servicesInitialized = true;
    logger.info('🎉 Express app ready for Netlify with serverless-http');
    
    return netlifyHandler;
  } catch (error) {
    logger.error('❌ Failed to initialize Express app for Netlify:', error);
    throw error;
  }
};

/**
 * Main Netlify Function handler using serverless-http
 */
export const handler = async (event, context) => {
  try {
    // Get the serverless handler
    const netlifyHandler = await getNetlifyHandler();
    
    // Call the serverless handler directly with Lambda-compatible event/context
    const response = await netlifyHandler(event, context);
    
    return response;
    
  } catch (error) {
    logger.error('❌ Netlify function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Function execution failed',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      })
    };
  }
};

export const config = {
  path: "/api/*"
};