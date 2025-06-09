# Server Utils - Helper Functions and Utilities

Utility modules provide reusable helper functions for common operations across the server. These modules are pure functions without side effects and can be used throughout the application.

## Files

### `logger.js`
**Purpose**: Simple logging utility with configurable log levels.

**Key Features**:
- **Log Levels**: error, warn, info, debug with hierarchy
- **Environment Aware**: Configurable via `LOG_LEVEL` environment variable
- **Structured Output**: Consistent timestamp and metadata formatting
- **Error Handling**: Special handling for Error objects with stack traces

**Log Levels**:
- `error` (0): Error messages only
- `warn` (1): Warnings and errors
- `info` (2): Information, warnings, and errors (default)
- `debug` (3): All messages including debug output

**Usage**:
```javascript
import { logger } from '../utils/logger.js';

logger.info('Processing request', { userId: 123 });
logger.error('Failed to connect', error);
logger.warn('Rate limit approaching');
logger.debug('Variable state', { data });
```

### `errors.js`
**Purpose**: Custom error classes and error creation utilities.

**Key Features**:
- **ApiError Class**: Structured errors with HTTP status codes and details
- **Error Factories**: Helper functions for common error types
- **Stack Trace Capture**: Proper error stack traces for debugging
- **Operational Flag**: Distinguishes operational from programming errors

**Error Types**:
- `createValidationError(message, details)` - 400 validation errors
- `createNotFoundError(resource)` - 404 resource not found
- `createUnauthorizedError(message)` - 401 authentication errors
- `createForbiddenError(message)` - 403 authorization errors
- `createRateLimitError(message)` - 429 rate limiting
- `createInternalError(message, details)` - 500 server errors

**Usage**:
```javascript
import { ApiError, createValidationError } from '../utils/errors.js';

throw new ApiError('Invalid date format', 400, 'Expected YYYY-MM-DD');
throw createValidationError('Missing required field: price');
```

### `marketData.js`
**Purpose**: Market data transformation and utility functions for GridStatus integration.

**Key Features**:
- **Timezone Conversion**: Converts Pacific Time data to user's timezone
- **Data Quality Management**: Handles missing data with interpolation and fallbacks
- **Price Aggregation**: Averages multiple records within time intervals
- **Data Validation**: Validates price ranges and timestamp formats
- **Statistical Analysis**: Calculates market statistics and spreads

**Core Functions**:

#### `transformGridStatusData(dayAheadData, realTimeData, userTimezone, date)`
- Transforms raw GridStatus API data to application format
- Handles timezone conversion from Pacific Time to user timezone
- Creates 24-hour arrays with missing data interpolation
- Returns structured data with quality metadata

#### `transformGridStatusRawToSpikeAnalysisFormat(rawData, userTimezone)`
- Converts raw data to spike analysis format
- Groups data by location/price node
- Adds regional metadata and location type classification

#### `calculateMarketStats(dayAheadPrices, realTimePrices)`
- Calculates market statistics including averages and spreads
- Computes volatility and price spread metrics
- Returns comprehensive market analysis data

**Data Quality Levels**:
- `actual`: Real data from GridStatus API
- `interpolated`: Calculated from adjacent hours
- `fallback`: Default values when no data available

### `timezone.js`
**Purpose**: Timezone handling and conversion utilities.

**Key Features**:
- **Pacific Time Focus**: CAISO operates in Pacific Time
- **DST Handling**: Automatically handles daylight saving time transitions
- **User Timezone Support**: Converts data to user's local timezone
- **Validation**: Validates timezone strings and date formats

### `trading.js`
**Purpose**: Trading simulation utilities and calculations.

**Key Features**:
- **Bid Execution**: Simulates bid execution against day-ahead prices
- **Settlement Calculation**: Calculates settlement at real-time prices
- **P&L Computation**: Profit/loss calculations with detailed breakdown
- **Market Impact**: Considers bid timing and market conditions

## Common Patterns

### Error Handling
```javascript
try {
  const data = await processData();
} catch (error) {
  logger.error('Processing failed', error);
  throw new ApiError('Data processing error', 500, error.message);
}
```

### Data Transformation
```javascript
const transformedData = transformGridStatusData(
  rawDayAhead,
  rawRealTime,
  userTimezone,
  requestDate
);

logger.info('Data transformed', {
  actualHours: transformedData.metadata.actualHours.length,
  interpolatedHours: transformedData.metadata.interpolatedHours.length
});
```

### Market Analysis
```javascript
const stats = calculateMarketStats(dayAheadPrices, realTimePrices);
logger.info('Market statistics calculated', {
  avgDayAhead: stats.avgDayAhead,
  avgRealTime: stats.avgRealTime,
  volatility: stats.volatility
});
```

All utilities are designed to be:
- **Pure Functions**: No side effects, testable
- **Environment Agnostic**: Work in Express and Netlify Functions
- **Error Resilient**: Graceful handling of edge cases
- **Performance Conscious**: Efficient algorithms for large datasets
- **Logging Integrated**: Comprehensive logging for debugging