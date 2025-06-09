# Hooks - Custom React Hooks

Custom hooks encapsulate reusable stateful logic and API interactions. All hooks follow React hooks conventions and integrate with React Query for server state management.

## Files

### `useMarketData.ts`

**Purpose**: Hook for fetching and managing market data from the backend API.

**Features**:

- **Date-based Fetching**: Automatically fetches data when selected date changes
- **React Query Integration**: Built-in caching, loading states, and error handling
- **Timezone Support**: Handles user timezone preferences
- **Automatic Refetching**: Keeps data fresh with background updates

**Usage**:

```typescript
import { useMarketData } from '../hooks/useMarketData';
import { useAppContext } from '../contexts/AppContext';

const MyComponent = () => {
  const { selectedDate } = useAppContext();
  const { data, error, loading, refetch } = useMarketData(selectedDate);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  
  return <MarketChart data={data} />;
};
```

### `useSpikeAnalysis.ts`

**Purpose**: Hook for AI-powered price spike detection and analysis.

**Features**:

- **Spike Detection**: Analyzes market data for price anomalies
- **AI Integration**: Connects to LLM services for spike analysis
- **Configuration Options**: Customizable detection thresholds and parameters
- **Analysis Results**: Returns detailed spike analysis with recommendations

**Usage**:

```typescript
import { useSpikeAnalysis } from '../hooks/useSpikeAnalysis';

const SpikeAnalysisComponent = () => {
  const { 
    analyzeSpikes, 
    analysis, 
    loading, 
    error 
  } = useSpikeAnalysis();

  const handleAnalyze = () => {
    analyzeSpikes({
      date: selectedDate,
      thresholds: { percentile: 95, magnitude: 100 }
    });
  };

  return (
    <div>
      <button onClick={handleAnalyze}>Analyze Spikes</button>
      {analysis && <AnalysisResults data={analysis} />}
    </div>
  );
};
```

### `useTradingSimulation.ts`

**Purpose**: Hook for managing trading simulation state and execution.

**Features**:

- **Bid Management**: Add, edit, and remove trading bids
- **Simulation Execution**: Run trading simulations against historical data
- **P&L Calculation**: Calculate profit/loss and trading performance
- **Form Integration**: Works with React Hook Form for bid forms

**Usage**:

```typescript
import { useTradingSimulation } from '../hooks/useTradingSimulation';

const TradingComponent = () => {
  const {
    bids,
    addBid,
    removeBid,
    simulateTrades,
    simulation,
    loading
  } = useTradingSimulation();

  const handleSubmit = (bidData) => {
    addBid(bidData);
  };

  const handleSimulate = () => {
    simulateTrades(selectedDate);
  };

  return (
    <div>
      <BidForm onSubmit={handleSubmit} />
      <BidList bids={bids} onRemove={removeBid} />
      <button onClick={handleSimulate}>Run Simulation</button>
      {simulation && <SimulationResults data={simulation} />}
    </div>
  );
};
```

## Hook Design Patterns

### React Query Integration

All hooks that fetch data use React Query for:

- Automatic caching and background updates
- Loading and error state management
- Request deduplication
- Optimistic updates

```typescript
export const useMarketData = (date: string) => {
  return useQuery({
    queryKey: ['marketData', date],
    queryFn: () => api.getMarketData(date),
    enabled: !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### State Management

Hooks manage their own internal state and expose clean interfaces:

```typescript
export const useTradingSimulation = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  const addBid = useCallback((bid: Bid) => {
    setBids(prev => [...prev, { ...bid, id: generateId() }]);
  }, []);

  return {
    bids,
    addBid,
    removeBid,
    simulation,
    simulateTrades,
    loading,
    error
  };
};
```

### Error Handling

Hooks provide consistent error handling:

```typescript
const { data, error, loading } = useMarketData(date);

// Error states are handled consistently across all hooks
if (error) {
  // Error handling logic
}
```

## Hook Benefits

### Reusability

Hooks can be used across multiple components without duplicating logic:

```typescript
// Used in Dashboard
const DashboardChart = () => {
  const { data } = useMarketData(selectedDate);
  return <Chart data={data} />;
};

// Used in Trading
const TradingChart = () => {
  const { data } = useMarketData(selectedDate);
  return <TradingChart data={data} />;
};
```

### Testability

Hooks can be tested independently of components:

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useMarketData } from './useMarketData';

test('useMarketData fetches data correctly', () => {
  const { result } = renderHook(() => useMarketData('2024-01-01'));
  expect(result.current.loading).toBe(true);
});
```

### Separation of Concerns

Hooks separate data fetching and state management from UI rendering:

- Components focus on presentation
- Hooks handle data and business logic
- Clear separation makes code easier to maintain

This approach promotes code reusability, testability, and maintainability across the React application.
