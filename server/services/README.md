# Server Services - Business Logic Layer

Services contain the core business logic and external integrations. Each service is a standalone class that can be used across different controllers and environments.

## Files

### `gridstatus.js`
**Purpose**: GridStatus.io API client for fetching CAISO electricity market data.

**Key Features**:
- **Rate Limiting**: Built-in 2-second interval between requests (GridStatus limit: 1/sec)
- **Pacific Time Operations**: All CAISO queries use Pacific Time for consistency
- **Error Handling**: Comprehensive error mapping and retry logic for 429 rate limits
- **Data Validation**: Validates dates and data integrity
- **Dataset Discovery**: Automatically finds day-ahead and real-time LMP datasets

**Core Methods**:
- `getMarketPrices(date, iso)`: Fetches both day-ahead and real-time prices
- `getDayAheadPrices(date, iso)`: Day-ahead LMP data
- `getRealTimePrices(date, iso)`: Real-time LMP data (5-min intervals)
- `getAvailableDatasets()`: Lists all available GridStatus datasets
- `testConnection()`: Validates API key and connection

**Cache Integration**: Uses DataCache for dataset caching (4-hour TTL).

### `dataCache.js`
**Purpose**: In-memory caching system to reduce API calls and improve performance.

**Key Features**:
- **TTL-based Expiration**: Configurable time-to-live for cache entries
- **Data Integrity**: Validates cached data and removes corrupted entries
- **Statistics Tracking**: Hit rates, memory usage, access patterns
- **Memory Management**: Automatic cleanup of expired entries
- **Serialization Safety**: Handles circular references and large objects

**Core Methods**:
- `set(endpoint, params, data)`: Store data with automatic key generation
- `get(endpoint, params)`: Retrieve data with expiration and validation
- `getStats()`: Cache performance metrics
- `cleanup()`: Remove expired entries
- `clear()`: Clear all cached data

**Usage Pattern**:
```javascript
const cache = new DataCache(60); // 60-minute TTL
cache.set('market-data', { date: '2024-01-01' }, marketData);
const cached = cache.get('market-data', { date: '2024-01-01' });
```

### `llmClient.js`
**Purpose**: Multi-provider LLM integration for AI-powered market analysis.

**Key Features**:
- **Multi-Provider Support**: OpenAI, Anthropic, Google AI, Together AI
- **Unified Interface**: Same API across all providers
- **Error Handling**: Provider-specific error mapping
- **Rate Limiting**: Provider-aware rate limiting
- **Prompt Templates**: Standardized prompts for market analysis

**Core Methods**:
- `analyzeSpike(spike, context, config)`: AI analysis of price spikes
- `generateTradeRecommendations(marketData, config)`: Trading strategy suggestions
- `analyzeTrends(data, config)`: Market trend analysis

### `spikeAnalyzer.js`
**Purpose**: Statistical algorithms for detecting and analyzing electricity price spikes.

**Key Features**:
- **Multiple Detection Methods**: Statistical thresholds, moving averages, percentile-based
- **Configurable Thresholds**: Customizable spike detection parameters
- **Spatial Analysis**: Cross-location spike correlation
- **Temporal Analysis**: Time-based spike patterns
- **Context Enrichment**: Adds market context to detected spikes

**Core Methods**:
- `detectSpikes(priceData, thresholds)`: Main spike detection algorithm
- `analyzeSpikeSeverity(spike, context)`: Classify spike severity
- `findSpatialCorrelations(spikes, locations)`: Cross-location analysis
- `calculateSpikeMetrics(spikes)`: Statistical analysis of spike patterns

## Service Integration Pattern

All services follow a consistent pattern:

### Initialization
```javascript
// In config/services.js
import GridStatusClient from '../services/gridstatus.js';
import DataCache from '../services/dataCache.js';

const gridStatusClient = new GridStatusClient(process.env.GRIDSTATUS_API_KEY);
const dataCache = new DataCache(60);
```

### Controller Usage
```javascript
// In controllers
import { getGridStatusClient, getDataCache } from '../config/services.js';

const services = {
  gridStatusClient: getGridStatusClient(),
  dataCache: getDataCache()
};
```

### Error Handling
```javascript
try {
  const data = await gridStatusClient.getMarketPrices(date);
} catch (error) {
  if (error instanceof ApiError) {
    // Handle known API errors
  }
  // Handle unexpected errors
}
```

## Environment Compatibility

All services are designed to work in both Express and Netlify Functions environments:
- Standard `process.env` environment variables
- Timeout handling for serverless constraints
- Memory-efficient operations
- Stateless operation (except caching)

Services integrate with the unified deployment architecture and provide consistent APIs regardless of the deployment environment.