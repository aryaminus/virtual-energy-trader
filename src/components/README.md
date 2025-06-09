# Components - Reusable UI Components

Components are organized by domain and feature area to promote maintainability and reusability. Each component is built with TypeScript and follows modern React patterns.

## Organization Strategy

Components are grouped by functional domain rather than technical type:

### `analysis/` - AI Analysis Components

Components for market analysis and AI-powered insights:

- **`AISettingsPanel.tsx`**: Configuration panel for AI analysis settings
- **`AnalysisResults.tsx`**: Display component for AI analysis results
- **`SpatialAnalysisChart.tsx`**: Geographic/spatial analysis visualization
- **`SpikeDetectionPanel.tsx`**: Price spike detection interface
- **`TemporalAnalysisChart.tsx`**: Time-based analysis charts

### `dashboard/` - Market Data Components

Components for displaying market data and statistics:

- **`DataQualityIndicator.tsx`**: Shows data quality metrics and status
- **`MarketDataChart.tsx`**: Main price chart with day-ahead and real-time data
- **`MarketInsights.tsx`**: Summary cards with key market insights
- **`MarketStatsGrid.tsx`**: Grid layout for market statistics

### `trading/` - Trading Interface Components

Components for bid placement and trading simulation:

- **`BidPlacementForm.tsx`**: Form for creating and editing bids
- **`BidSummary.tsx`**: Summary display of placed bids
- **`BidValidationHelper.tsx`**: Real-time bid validation feedback
- **`MarketPriceDisplay.tsx`**: Current market price information
- **`SimulationResults.tsx`**: Trading simulation results and P&L
- **`TradingDeadlineNotice.tsx`**: Trading deadline warnings and notices

### `common/` - Shared Components

Components used across multiple domains:

- **`DateSelector.tsx`**: Date picker for market date selection

### `layout/` - Layout Components

Application structure and navigation components:

- **`Footer.tsx`**: Application footer with links and info
- **`Header.tsx`**: Main application header with branding
- **`Navigation.tsx`**: Primary navigation menu

### `ui/` - Base UI Components

Low-level, reusable UI primitives:

- **`ErrorMessage.tsx`**: Standardized error display component
- **`LoadingSpinner.tsx`**: Loading state indicator
- **`StatCard.tsx`**: Card component for displaying statistics

## Component Patterns

### Props Interface Pattern

```typescript
interface ComponentProps {
  data: MarketData;
  onUpdate: (data: MarketData) => void;
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({ data, onUpdate, className }) => {
  // Component implementation
};
```

### State Management Pattern

- **Local State**: Use `useState` for component-specific state
- **Global State**: Use `useAppContext` for shared application state
- **Server State**: Use React Query hooks for API data

### Styling Pattern

- **Tailwind CSS**: Utility-first styling approach
- **Responsive Design**: Mobile-first responsive components
- **Consistent Spacing**: Standardized spacing and sizing

### Error Handling Pattern

```typescript
if (error) {
  return <ErrorMessage message={error.message} />;
}

if (loading) {
  return <LoadingSpinner />;
}
```

## Component Communication

### Props Down, Events Up

- Parent components pass data down via props
- Child components communicate up via callback functions
- Avoid prop drilling by using context for deeply nested data

### Context Integration

```typescript
import { useAppContext } from '../contexts/AppContext';

const { selectedDate, setSelectedDate } = useAppContext();
```

### API Integration

```typescript
import { useMarketData } from '../hooks/useMarketData';

const { data, error, loading } = useMarketData(selectedDate);
```

## Reusability Guidelines

### Single Responsibility

Each component has a single, well-defined purpose and can be used in multiple contexts.

### Configurable Behavior

Components accept props to configure their behavior rather than hard-coding values.

### Accessibility

All components follow accessibility best practices:

- Proper semantic HTML
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

### Testing Considerations

Components are designed to be easily testable:

- Clear prop interfaces
- Minimal external dependencies
- Predictable behavior
- Easy to mock dependencies

This organization promotes code reusability, maintainability, and clear separation of concerns across the application.
