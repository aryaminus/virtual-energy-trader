# Server Middleware - Request Processing Layer

Middleware functions handle cross-cutting concerns like logging, error handling, and input validation. All middleware follows Express.js conventions and can be composed in the request pipeline.

## Files

### `errorHandler.js`
**Purpose**: Centralized error handling for all API endpoints.

**Key Features**:
- **Structured Error Responses**: Consistent JSON error format across all endpoints
- **Error Type Detection**: Different handling for ApiError, ValidationError, SyntaxError, etc.
- **Security**: Hides sensitive error details in production environment
- **Request Context**: Logs error details with request information (URL, method, IP, User-Agent)

**Error Types Handled**:
- `ApiError`: Custom application errors with specific HTTP status codes
- `ValidationError`: Input validation failures
- `SyntaxError`: JSON parsing errors
- Rate limit errors (429)
- 404 Not Found routes

**Response Format**:
```javascript
{
  success: false,
  error: "User-friendly error message",
  details: "Additional error context",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

### `logger.js`
**Purpose**: HTTP request/response logging middleware.

**Key Features**:
- **Request Logging**: Logs incoming requests with method, URL, IP, User-Agent
- **Response Logging**: Logs response status and duration
- **Performance Monitoring**: Tracks request processing time
- **Non-blocking**: Asynchronous logging doesn't impact request performance

**Log Format**:
- Incoming: `📥 GET /api/market-data/2024-01-01`
- Outgoing: `📤 GET /api/market-data/2024-01-01 - 200 (145ms)`

### `validation.js`
**Purpose**: Input validation middleware for different endpoint types.

**Validation Functions**:

#### `validateDateParam`
- Validates date parameters in YYYY-MM-DD format
- Ensures date is not too far in the future (max 7 days)
- Prevents invalid date values

#### `validateISOQuery`
- Validates Independent System Operator (ISO) query parameters
- Supports: CAISO, ERCOT, ISONE, MISO, NYISO, PJM, SPP
- Auto-converts to uppercase for consistency

#### `validateTradeSimulation`
- Validates trading simulation request bodies
- Ensures bids array is present and non-empty
- Validates individual bid structure:
  - `id`: Required string identifier
  - `hour`: Number between 0-23
  - `type`: 'buy' or 'sell'
  - `price`: Positive number
  - `quantity`: Positive number

#### `validateSpikeAnalysis`
- Validates spike analysis requests
- Ensures analysis type is one of: 'detection', 'correlation', 'prediction'
- Validates threshold configuration objects

#### `validateAIAnalysis`
- Validates AI analysis requests
- Ensures required objects: spike, contextData, llmConfig
- Validates LLM configuration (provider, model)

## Usage Patterns

### In Routes
```javascript
import { validateDateParam, validateISOQuery } from '../middleware/validation.js';

router.get('/market-data/:date', 
  validateDateParam,
  validateISOQuery,
  controller.getMarketData
);
```

### In App Configuration
```javascript
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

app.use(requestLogger);           // Log all requests
app.use('/api', routes);          // Handle API routes
app.use(notFoundHandler);         // Handle 404s
app.use(errorHandler);            // Handle all errors (must be last)
```

All middleware integrates with the unified service layer and follows Express.js best practices for composability and error handling.