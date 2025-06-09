# Server Controllers - Business Logic Layer

Controllers handle HTTP request processing, coordinate with services, and return structured responses. Each controller follows a consistent pattern for error handling, caching, and service integration.

## Architecture Pattern

All controllers follow this standard structure:
1. **Input Validation**: Request parameter and body validation
2. **Service Access**: Get services via unified service configuration
3. **Caching Logic**: Check cache first, then API, then cache results
4. **Business Logic**: Core processing using service layer
5. **Error Handling**: Structured error responses with proper HTTP codes
6. **Response Formation**: Consistent JSON response format

## Files

### `marketController.js`
**Purpose**: Handles market data retrieval and dataset management.

**Key Features**:
- **Timezone Support**: Converts market data to user's timezone
- **Intelligent Caching**: Prevents redundant GridStatus API calls
- **Error Mapping**: Maps GridStatus API errors to user-friendly messages
- **Data Validation**: Validates market data integrity before caching

**Endpoints**:
- `GET /api/market-data/:date`: Historical market data with timezone conversion
- `GET /api/datasets`: Available GridStatus datasets with CAISO filtering

**Cache Strategy**: Market data cached by date, ISO, and timezone combination.

### `tradingController.js`
**Purpose**: Executes trading simulations against historical market data.

**Key Features**:
- **Bid Validation**: Comprehensive validation of trading bid structure
- **Market Data Integration**: Fetches/caches market data for simulation
- **Trade Execution**: Simulates bid execution using day-ahead and real-time prices
- **Profit Calculation**: Calculates P&L based on execution vs settlement prices

**Endpoints**:
- `POST /api/simulate-trades`: Execute trading simulation with user bids

**Business Logic**: Bids execute against day-ahead prices, settle at real-time prices.

### `analysisController.js`
**Purpose**: Provides AI-powered market analysis and insights.

**Key Features**:
- **Multi-Provider LLM**: Supports OpenAI, Anthropic, Google, Together AI
- **Market Context**: Analyzes market data trends and patterns
- **Spike Detection**: Identifies and analyzes price spikes
- **Trading Recommendations**: AI-generated trading strategies

**Endpoints**:
- `POST /api/analysis/market`: Market trend analysis
- `POST /api/analysis/spikes`: Price spike detection and analysis

### `healthController.js`
**Purpose**: System health monitoring and configuration status.

**Key Features**:
- **Service Status**: Reports health of all connected services
- **API Configuration**: Validates API key configurations
- **Cache Metrics**: Cache performance and statistics
- **Environment Info**: Deployment environment and feature availability

**Endpoints**:
- `GET /api/health`: Comprehensive system health check
- `GET /api/health/status`: Basic service availability

### `cacheController.js`
**Purpose**: Cache management and performance monitoring.

**Key Features**:
- **Cache Statistics**: Hit rates, memory usage, entry counts
- **Cache Control**: Manual cache clearing and management
- **Performance Metrics**: Cache effectiveness analysis

**Endpoints**:
- `GET /api/cache/stats`: Cache performance metrics
- `DELETE /api/cache`: Clear all cached data

## Common Patterns

### Service Integration
```javascript
import { getGridStatusClient, getDataCache } from '../config/services.js';

const getServices = () => ({
  gridStatusClient: getGridStatusClient(),
  dataCache: getDataCache()
});
```

### Error Handling
```javascript
import { ApiError } from '../utils/errors.js';

if (!services.gridStatusClient) {
  throw new ApiError('GridStatus API not configured', 503);
}
```

### Response Format
```javascript
const response = {
  success: true,
  data: processedData,
  metadata: {
    timestamp: new Date().toISOString(),
    source: 'gridstatus-api'
  }
};
```

### Caching Pattern
```javascript
// Check cache first
const cached = dataCache.get(key, params);
if (cached) return cached;

// Fetch from API
const data = await api.fetchData();

// Cache for future use
dataCache.set(key, params, data);
```

All controllers integrate with the unified service layer and follow consistent patterns for reliability, performance, and maintainability.