# Pages - Top-Level Page Components

Page components represent the main application views and correspond to routes in the React Router configuration. Each page orchestrates multiple components to create complete user experiences.

## Files

### `Dashboard.tsx`

**Purpose**: Market data overview and real-time pricing dashboard.

**Features**:

- **Market Data Visualization**: Charts showing day-ahead and real-time prices
- **Market Statistics**: Key metrics and market insights
- **Data Quality Indicators**: Shows data completeness and quality
- **Real-time Updates**: Automatically refreshes data based on selected date

**Components Used**:

- `MarketDataChart` - Main price visualization
- `MarketStatsGrid` - Grid of market statistics
- `DataQualityIndicator` - Data quality metrics
- `MarketInsights` - Summary insights and trends

**State Management**:

- Uses `useAppContext` for selected date
- Uses `useMarketData` hook for fetching market data
- Local state for chart configuration and view options

### `Trading.tsx`

**Purpose**: Trading simulation interface for bid placement and execution.

**Features**:

- **Bid Management**: Create, edit, and manage trading bids
- **Market Price Display**: Current pricing information for informed bidding
- **Trading Simulation**: Execute bids against historical market data
- **P&L Analysis**: Detailed profit/loss calculations and results
- **Trading Deadlines**: Warnings and notices about market timing

**Components Used**:

- `BidPlacementForm` - Form for creating bids
- `BidSummary` - List of current bids
- `MarketPriceDisplay` - Current market pricing
- `SimulationResults` - Trading results and analysis
- `TradingDeadlineNotice` - Timing warnings

**State Management**:

- Uses `useTradingSimulation` hook for bid management
- Uses `useMarketData` for current pricing
- Form state managed by React Hook Form

### `Analysis.tsx`

**Purpose**: AI-powered market analysis and price spike detection.

**Features**:

- **Spike Detection**: Automated price anomaly detection
- **AI Analysis**: LLM-powered market insights and recommendations
- **Spatial Analysis**: Geographic price correlation analysis
- **Temporal Analysis**: Time-based pattern recognition
- **Analysis Configuration**: Customizable analysis parameters

**Components Used**:

- `SpikeDetectionPanel` - Spike detection configuration
- `AISettingsPanel` - AI analysis settings
- `AnalysisResults` - AI-generated insights
- `SpatialAnalysisChart` - Geographic analysis visualization
- `TemporalAnalysisChart` - Time-based analysis charts

**State Management**:

- Uses `useSpikeAnalysis` hook for spike detection
- Uses `useMarketData` for analysis input data
- Local state for analysis configuration

## Page Architecture Pattern

### Layout Integration

All pages use the common layout structure:

```typescript
// In App.tsx
<Layout>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/trading" element={<Trading />} />
    <Route path="/analysis" element={<Analysis />} />
  </Routes>
</Layout>
```

### Component Composition

Pages compose multiple domain-specific components:

```typescript
const Dashboard: React.FC = () => {
  const { selectedDate } = useAppContext();
  const { data, loading, error } = useMarketData(selectedDate);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="space-y-6">
      <MarketDataChart data={data} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MarketStatsGrid stats={data.stats} />
        <DataQualityIndicator quality={data.quality} />
        <MarketInsights insights={data.insights} />
      </div>
    </div>
  );
};
```

### Error Boundary Pattern

Pages implement consistent error handling:

```typescript
const TradingPage: React.FC = () => {
  const { error } = useTradingSimulation();

  if (error) {
    return (
      <ErrorBoundary>
        <ErrorMessage message="Failed to load trading interface" />
      </ErrorBoundary>
    );
  }

  return <TradingInterface />;
};
```

## Routing and Navigation

### Route Configuration

Routes are configured in `App.tsx`:

```typescript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/trading" element={<Trading />} />
  <Route path="/analysis" element={<Analysis />} />
</Routes>
```

### Navigation Integration

Pages integrate with the navigation component for active state management.

### Page Transitions

Smooth transitions between pages with loading states and error boundaries.

## Responsive Design

### Mobile-First Approach

All pages are designed with mobile-first responsive principles:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid layout */}
</div>
```

### Adaptive Components

Components adapt to different screen sizes and orientations.

## Performance Considerations

### Code Splitting

Pages can be lazy-loaded for better performance:

```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Trading = lazy(() => import('./pages/Trading'));
const Analysis = lazy(() => import('./pages/Analysis'));
```

### Data Prefetching

React Query automatically handles data prefetching and background updates.

### Memoization

Components use React.memo and useMemo for performance optimization where appropriate.

This page architecture promotes maintainability, reusability, and provides a consistent user experience across the application.
