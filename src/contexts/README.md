# Contexts - Global State Management

React Context providers for managing shared application state that needs to be accessible across multiple components without prop drilling.

## Files

### `AppContext.tsx`

**Purpose**: Central application context for managing global state shared across all components.

**State Management**:

- **`selectedDate`**: The currently selected market date (string in YYYY-MM-DD format)
- **`setSelectedDate`**: Function to update the selected date

**Key Features**:

- **Default Initialization**: Automatically sets to yesterday's date on first load
- **Type Safety**: Full TypeScript interface definitions
- **Hook Integration**: Custom hook (`useAppContext`) for easy consumption
- **Error Boundary**: Throws error if used outside provider

**Usage Pattern**:

```typescript
// Provider setup (in App.tsx)
<AppProvider>
  <YourAppComponents />
</AppProvider>

// Consumer usage
import { useAppContext } from '../contexts/AppContext';

const MyComponent = () => {
  const { selectedDate, setSelectedDate } = useAppContext();
  
  return (
    <DatePicker 
      value={selectedDate}
      onChange={setSelectedDate}
    />
  );
};
```

**Why This Architecture**:

- **Centralized Date State**: All market data fetching depends on a single date
- **Synchronized Updates**: When date changes, all components automatically update
- **Prevents Prop Drilling**: Date doesn't need to be passed through intermediate components
- **Type Safety**: Ensures consistent date format across the application

## Context Design Principles

### Single Responsibility

Each context has a single, well-defined purpose. `AppContext` specifically manages the selected date state.

### Minimal State

Contexts only contain state that truly needs to be global. Component-specific state remains local.

### Provider Pattern

```typescript
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const value = {
    selectedDate,
    setSelectedDate,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
```

### Custom Hook Pattern

```typescript
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
```

## Integration with Other State Management

### React Query for Server State

- Context handles client-side global state
- React Query handles server state (API data, caching, loading states)
- Clear separation between local and remote state

### Local Component State

- Components still use `useState` for local state
- Context only for state that needs to be shared globally

### State Flow

```
User Action → Context Update → React Query Refetch → Component Re-render
```

## Future Extensibility

The context structure is designed to be easily extensible:

```typescript
interface AppContextType {
  // Current state
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  
  // Future additions
  selectedISO?: string;
  setSelectedISO?: (iso: string) => void;
  userPreferences?: UserPreferences;
  setUserPreferences?: (prefs: UserPreferences) => void;
}
```

This approach ensures that global state is managed efficiently while maintaining clear boundaries between different types of state in the application.
