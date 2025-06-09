# Server Config - Service Initialization

This directory contains configuration modules that handle service initialization and environment setup for the unified deployment architecture.

## Files

### `services.js`
**Purpose**: Unified service initialization for both Express and Netlify Functions environments.

**Key Features**:
- **Environment Detection**: Automatically detects Express vs Netlify Functions context
- **Service Singletons**: Manages global instances of core services (GridStatus, DataCache, SpikeAnalyzer)
- **Unified API**: Same service interface regardless of deployment environment
- **Service Lifecycle**: Handles initialization, access, and cleanup of service instances

**Core Functions**:
- `initializeServices()`: Initialize all services with environment detection
- `getGridStatusClient()`: Access to CAISO market data client
- `getDataCache()`: Access to intelligent caching service
- `getSpikeAnalyzer()`: Access to price spike detection service
- `getEnvironmentType()`: Returns 'express' or 'netlify'

**Environment Variables Used**:
- `GRIDSTATUS_API_KEY`: GridStatus.io API access
- `NETLIFY`: Netlify environment detection
- `AWS_LAMBDA_FUNCTION_NAME`: Lambda/Netlify Functions detection

**Usage Pattern**:
```javascript
import { initializeServices, getGridStatusClient } from '../config/services.js';

// Initialize once at startup
await initializeServices();

// Access services anywhere
const gridStatus = getGridStatusClient();
const data = await gridStatus.fetchMarketData();
```

This configuration approach ensures that service initialization is consistent across development (Express) and production (Netlify Functions) environments, following the unified deployment strategy.