# Frontend - React Application Architecture

The src directory contains the React frontend built with TypeScript, Vite, and modern React patterns. The application provides an interactive interface for energy trading simulation and market analysis.

## Architecture Overview

### Technology Stack

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development with strict type checking
- **Vite**: Fast development server and build tool
- **React Router**: Client-side routing for SPA navigation
- **React Query (@tanstack/react-query)**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Hook Form**: Form handling with validation
- **Recharts**: Data visualization and charting library

### State Management Strategy

- **Global State**: React Context for shared application state (`selectedDate`)
- **Server State**: React Query for API data caching and synchronization
- **Local State**: React hooks for component-specific state
- **Form State**: React Hook Form for form handling and validation

### Application Structure

```
src/
├── components/          # Reusable UI components organized by domain
├── pages/              # Top-level page components for routing
├── contexts/           # React Context providers for global state
├── hooks/              # Custom React hooks for shared logic
├── lib/                # Utility libraries and API clients
├── types/              # TypeScript type definitions
├── layouts/            # Layout components for page structure
└── App.tsx             # Root application component
```

## Key Architecture Decisions

### Context-Based Global State

The application uses React Context (`AppContext`) to manage global state, specifically the `selectedDate` which drives all market data fetching across components.

### React Query Integration

All API calls use React Query for:

- Automatic caching and background updates
- Loading and error state management
- Optimistic updates and retry logic
- Server state synchronization

### Component Organization

Components are organized by domain (analysis, dashboard, trading) rather than by type, promoting feature-based development and easier maintenance.

### Type Safety

Full TypeScript integration with:

- Strict type checking enabled
- Interface definitions for all data structures
- Proper typing for API responses and component props

## Core Files

### `App.tsx`

Root application component that sets up:

- React Query client configuration
- React Router for navigation
- Global context providers
- Layout structure and routing

### `main.tsx`

Application entry point that:

- Initializes React with StrictMode
- Mounts the app to the DOM
- Imports global CSS styles

### Development Features

- **Hot Module Replacement**: Instant updates during development
- **Type Checking**: Real-time TypeScript validation
- **ESLint Integration**: Code quality enforcement
- **Development Tools**: React Query DevTools for debugging

## API Integration

### Proxy Configuration

Vite development server proxies `/api/*` requests to `http://localhost:3001` for seamless backend integration during development.

### Production Build

- Optimized bundle with code splitting
- Static asset optimization
- TypeScript compilation to JavaScript
- Tailwind CSS purging for minimal bundle size

## Environment Setup

```bash
npm run dev:client    # Start development server
npm run dev          # Start both frontend and backend
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

The frontend integrates seamlessly with the backend API and provides a modern, responsive interface for energy trading simulation and market analysis.
