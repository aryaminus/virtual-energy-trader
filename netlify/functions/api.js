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
export default async (request, context) => {
  try {
    // Get the serverless handler
    const handler = await getNetlifyHandler();
    
    // Convert the request to the format expected by serverless-http
    const event = {
      httpMethod: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      path: new URL(request.url).pathname,
      queryStringParameters: Object.fromEntries(new URL(request.url).searchParams),
      body: request.method !== 'GET' ? await request.text() : null,
      isBase64Encoded: false
    };
    
    // Call the serverless handler
    const response = await handler(event, context);
    
    // Convert the response back to Web API Response format
    return new Response(response.body, {
      status: response.statusCode,
      headers: response.headers || {}
    });
    
  } catch (error) {
    logger.error('❌ Netlify function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Function execution failed',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

export const config = {
  path: "/api/*"
};