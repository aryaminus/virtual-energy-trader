import { createApp } from "../../server/app.js";
import { initializeServices } from "../../server/config/services.js";
import { logger } from "../../server/utils/logger.js";

// Cache the Express app instance
let expressApp = null;
let servicesInitialized = false;

/**
 * Initialize Express app for Netlify (cached)
 */
const getExpressApp = async () => {
  if (expressApp && servicesInitialized) {
    return expressApp;
  }
  
  try {
    logger.info('🔧 Initializing Express app for Netlify...');
    
    // Initialize services first
    await initializeServices();
    
    // Create Express app
    expressApp = createApp();
    servicesInitialized = true;
    
    logger.info('🎉 Express app ready for Netlify');
    return expressApp;
  } catch (error) {
    logger.error('❌ Failed to initialize Express app for Netlify:', error);
    throw error;
  }
};

/**
 * Convert Netlify Request to Node.js request-like object
 */
const createNodeRequest = async (netlifyRequest) => {
  const url = new URL(netlifyRequest.url);
  
  // Parse body for non-GET requests
  let body = '';
  if (netlifyRequest.method !== 'GET' && netlifyRequest.body) {
    try {
      body = await netlifyRequest.text();
    } catch (error) {
      body = '';
    }
  }
  
  // Create Node.js-style request object
  const req = {
    method: netlifyRequest.method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(netlifyRequest.headers.entries()),
    body,
    // Express-specific properties
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    params: {},
    ip: netlifyRequest.headers.get('x-forwarded-for') || '127.0.0.1',
    hostname: url.hostname,
    protocol: url.protocol.replace(':', ''),
    originalUrl: url.pathname + url.search,
    get: function(header) {
      return this.headers[header.toLowerCase()];
    }
  };

  // If there's a body, parse it as JSON for Express
  if (body && netlifyRequest.headers.get('content-type')?.includes('application/json')) {
    try {
      req.body = JSON.parse(body);
    } catch (error) {
      req.body = {};
    }
  }

  return req;
};

/**
 * Create Node.js response-like object that captures Express output
 */
const createNodeResponse = () => {
  let statusCode = 200;
  let headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
  let body = '';
  let finished = false;

  const res = {
    statusCode,
    headersSent: false,
    
    status(code) {
      statusCode = code;
      return this;
    },
    
    set(field, value) {
      if (typeof field === 'object') {
        Object.assign(headers, field);
      } else {
        headers[field] = value;
      }
      return this;
    },
    
    header(field, value) {
      return this.set(field, value);
    },
    
    // Express-specific methods
    setHeader(name, value) {
      headers[name] = value;
    },
    
    getHeader(name) {
      return headers[name];
    },
    
    removeHeader(name) {
      delete headers[name];
    },
    
    writeHead(statusCode, reasonPhrase, headers) {
      this.statusCode = statusCode;
      if (typeof reasonPhrase === 'object') {
        // reasonPhrase is actually headers
        Object.assign(this.headers, reasonPhrase);
      } else if (headers) {
        Object.assign(this.headers, headers);
      }
    },
    
    write(chunk) {
      body += String(chunk);
    },
    
    json(data) {
      this.set('Content-Type', 'application/json');
      body = JSON.stringify(data);
      this.end();
    },
    
    send(data) {
      if (typeof data === 'object') {
        this.json(data);
      } else {
        body = String(data);
        this.end();
      }
    },
    
    end(data) {
      if (data !== undefined) {
        body = String(data);
      }
      finished = true;
      
      // Create and resolve with Web Response
      const response = new Response(body, {
        status: statusCode,
        headers
      });
      
      if (this._resolve) {
        this._resolve(response);
      }
    },
    
    // Express middleware compatibility
    locals: {},
    
    // Event emitter methods (minimal implementation)
    on() {},
    once() {},
    emit() {},
    
    // Check if response is finished
    get finished() {
      return finished;
    }
  };

  return res;
};

/**
 * Main Netlify Function handler
 */
export default async (request, _context) => {
  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        }
      });
    }

    // Get Express app
    const app = await getExpressApp();
    
    // Convert Netlify request/response to Express format
    const req = await createNodeRequest(request);
    const res = createNodeResponse();
    
    // Handle the request with Express
    return new Promise((resolve, _reject) => {
      // Store resolve function for response handling
      res._resolve = resolve;
      
      // Set up timeout (Netlify has 10s limit for functions)
      const timeout = setTimeout(() => {
        if (!res.finished) {
          logger.warn('⚠️ Request timeout in Netlify function');
          resolve(new Response(JSON.stringify({
            success: false,
            error: 'Request timeout'
          }), {
            status: 504,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }));
        }
      }, 9000); // 9 second timeout (leave 1s buffer)
      
      // Override resolve to clear timeout
      const originalResolve = res._resolve;
      res._resolve = (response) => {
        clearTimeout(timeout);
        originalResolve(response);
      };
      
      // Error handler
      const errorHandler = (error) => {
        clearTimeout(timeout);
        logger.error('❌ Express error in Netlify function:', error);
        
        if (!res.finished) {
          resolve(new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }));
        }
      };

      try {
        // Process request through Express app
        app(req, res, errorHandler);
      } catch (error) {
        errorHandler(error);
      }
    });

  } catch (error) {
    logger.error('❌ Netlify function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Function initialization failed',
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