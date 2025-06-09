# Lib - Utility Libraries and API Client

Library modules provide utility functions and API integration for the frontend application. These modules are pure functions and reusable utilities.

## Files

### `api.ts`

**Purpose**: Centralized API client for all backend communication.

**Key Features**:

- **Axios Integration**: HTTP client with interceptors and error handling
- **TypeScript Support**: Fully typed API responses and requests
- **Error Mapping**: Converts backend errors to frontend-friendly formats
- **Request/Response Interceptors**: Automatic logging and error handling

**API Methods**:

```typescript
// Market data
getMarketData(date: string, iso?: string): Promise<MarketDataResponse>
getAvailableDatasets(): Promise<DatasetsResponse>

// Trading simulation
simulateTrades(bids: Bid[], date: string): Promise<SimulationResponse>

// AI Analysis
analyzeSpikes(config: SpikeAnalysisConfig): Promise<AnalysisResponse>
analyzeMarket(data: MarketData, config: AIConfig): Promise<AnalysisResponse>

// System health
getHealthStatus(): Promise<HealthResponse>
getCacheStats(): Promise<CacheStatsResponse>
```

**Configuration**:

- **Base URL**: Automatically configured for development and production
- **Timeout**: Configured for optimal performance
- **Headers**: Includes proper content-type and user-agent

### `marketUtils.ts`

**Purpose**: Utility functions for market data processing and calculations.

**Key Features**:

- **Price Calculations**: Functions for calculating spreads, averages, and volatility
- **Data Validation**: Validates market data integrity and format
- **Time Utilities**: Handles market hours and trading windows
- **Statistical Analysis**: Market statistics and trend calculations

**Utility Functions**:

```typescript
// Price calculations
calculateSpread(dayAheadPrice: number, realTimePrice: number): number
calculateVolatility(prices: number[]): number
getMarketAverage(prices: PriceData[]): number

// Data validation
validateMarketData(data: MarketData): boolean
isMarketHour(hour: number): boolean
isValidPrice(price: number): boolean

// Statistical analysis
findPriceSpikes(data: PriceData[], threshold: number): Spike[]
calculateMarketStats(data: MarketData): MarketStats
```

### `utils.ts`

**Purpose**: General utility functions used throughout the application.

**Key Features**:

- **Date Formatting**: Consistent date formatting and parsing
- **Number Formatting**: Currency and percentage formatting
- **Validation Helpers**: Form validation utilities
- **Type Guards**: TypeScript type checking utilities

**Utility Functions**:

```typescript
// Date utilities
formatDate(date: string): string
parseDate(dateString: string): Date
isValidDate(date: string): boolean

// Number formatting
formatCurrency(amount: number): string
formatPercentage(value: number): string
roundToDecimal(value: number, decimals: number): number

// Validation
isValidEmail(email: string): boolean
isValidPhoneNumber(phone: string): boolean
isEmpty(value: any): boolean

// Type guards
isString(value: any): value is string
isNumber(value: any): value is number
isObject(value: any): value is object
```

## Design Patterns

### API Client Pattern

Centralized API client with consistent error handling:

```typescript
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  async getMarketData(date: string): Promise<MarketDataResponse> {
    const response = await this.client.get(`/market-data/${date}`);
    return response.data;
  }
}
```

### Error Handling Pattern

Consistent error handling across all API calls:

```typescript
private handleError(error: AxiosError) {
  if (error.response?.status === 404) {
    throw new Error('Data not found for the selected date');
  }
  if (error.response?.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  throw new Error(error.message || 'An unexpected error occurred');
}
```

### Utility Function Pattern

Pure functions with clear inputs and outputs:

```typescript
export const calculateSpread = (dayAheadPrice: number, realTimePrice: number): number => {
  if (!isValidPrice(dayAheadPrice) || !isValidPrice(realTimePrice)) {
    throw new Error('Invalid price values');
  }
  return realTimePrice - dayAheadPrice;
};
```

## Integration with Frontend

### React Query Integration

API client works seamlessly with React Query:

```typescript
// In hooks/useMarketData.ts
import { api } from '../lib/api';

export const useMarketData = (date: string) => {
  return useQuery({
    queryKey: ['marketData', date],
    queryFn: () => api.getMarketData(date),
    enabled: !!date,
  });
};
```

### Component Integration

Utilities are used throughout components:

```typescript
// In components
import { formatCurrency, calculateSpread } from '../lib/utils';
import { validateMarketData } from '../lib/marketUtils';

const PriceDisplay = ({ dayAhead, realTime }) => {
  const spread = calculateSpread(dayAhead, realTime);
  
  return (
    <div>
      <span>Day-Ahead: {formatCurrency(dayAhead)}</span>
      <span>Real-Time: {formatCurrency(realTime)}</span>
      <span>Spread: {formatCurrency(spread)}</span>
    </div>
  );
};
```

## Environment Configuration

### Development vs Production

Different configurations for different environments:

```typescript
const apiConfig = {
  baseURL: import.meta.env.PROD 
    ? 'https://your-api.netlify.app'
    : '/api',
  timeout: import.meta.env.PROD ? 15000 : 10000,
};
```

This approach ensures that utility functions are reusable, testable, and maintain separation of concerns between business logic and UI components.
