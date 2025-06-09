# Server Routes - API Endpoint Definitions

Routes define the API endpoints and connect them to appropriate controllers and middleware. Each route file corresponds to a specific feature domain and follows RESTful conventions.

## Architecture Pattern

All route files follow this structure:
1. **Import Dependencies**: Router, controllers, and validation middleware
2. **Route Definition**: HTTP method, path, middleware chain, controller
3. **Documentation**: JSDoc comments for each endpoint
4. **Export**: Default export of configured router

## Files

### `market.js`
**Purpose**: Market data and dataset endpoints.

**Routes**:
- `GET /api/market/data/:date` - Historical market data with timezone support
  - Middleware: `validateDateParam`, `validateISOQuery`
  - Controller: `marketController.getMarketData`
  - Query params: `iso` (optional), `timezone` (optional)

- `GET /api/market/datasets` - Available GridStatus datasets
  - Controller: `marketController.getAvailableDatasets`
  - Returns CAISO-relevant datasets with caching

### `trading.js`
**Purpose**: Trading simulation endpoints.

**Routes**:
- `POST /api/trading/simulate` - Execute trading simulation
  - Middleware: `validateTradeSimulation`
  - Controller: `tradingController.simulateTrades`
  - Body: `{ bids: [], date: "YYYY-MM-DD" }`

### `analysis.js`
**Purpose**: AI-powered market analysis endpoints.

**Routes**:
- `POST /api/analysis/market` - Market trend analysis
- `POST /api/analysis/spikes` - Price spike detection and analysis
- Middleware: Various validation for analysis parameters
- Controllers: `analysisController.*`

### `health.js`
**Purpose**: System health and monitoring endpoints.

**Routes**:
- `GET /api/health` - Comprehensive system health check
- `GET /api/health/status` - Basic service availability
- Controller: `healthController.*`

### `cache.js`
**Purpose**: Cache management endpoints.

**Routes**:
- `GET /api/cache/stats` - Cache performance metrics
- `DELETE /api/cache` - Clear all cached data
- Controller: `cacheController.*`

## Route Patterns

### Standard Route Structure
```javascript
import { Router } from 'express';
import { controllerFunction } from '../controllers/domainController.js';
import { validationMiddleware } from '../middleware/validation.js';

const router = Router();

router.method('/path/:param',
  validationMiddleware,  // Input validation
  controllerFunction     // Business logic
);

export default router;
```

### Middleware Chain
1. **Validation**: Input validation and sanitization
2. **Authentication**: (Future enhancement for protected routes)
3. **Rate Limiting**: (Future enhancement for API limits)
4. **Controller**: Business logic execution

### Documentation Format
```javascript
/**
 * @route HTTP_METHOD /api/domain/endpoint
 * @desc Brief description of endpoint purpose
 * @access Public/Private
 */
```

## Route Integration

Routes are mounted in `app.js`:
```javascript
app.use('/api/market', marketRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/cache', cacheRoutes);
```

All routes integrate with the unified service layer through their respective controllers and support both Express and Netlify Functions deployment environments.