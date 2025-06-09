# Architecture

## Technical Architecture

### Full-Stack Architecture Overview

This application uses a modern, unified architecture that works seamlessly across development and production environments:

**Frontend (React + TypeScript)**

- React 18 with TypeScript for type-safe development
- Vite for fast development and optimized builds
- React Query for server state management and caching
- Tailwind CSS for responsive, professional styling
- Recharts for interactive data visualization

**Backend (Node.js + Express)**

- Express.js API server with unified deployment strategy
- Same codebase works in development (Express) and production (Netlify Functions)
- GridStatus.io integration for real CAISO market data
- Multi-provider LLM integration (OpenAI, Anthropic, Google, Together AI)
- Intelligent data caching to manage API rate limits

**Unified Deployment Strategy**

- Development: Full Express server on port 3001
- Production: Same Express app wrapped with serverless-http for Netlify Functions
- Environment detection automatically handles differences
- Zero code duplication between environments

### Detailed Architecture

#### Frontend Structure (`src/`)

```
src/
├── components/          # Domain-organized reusable components
│   ├── analysis/        # AI analysis and spike detection
│   ├── dashboard/       # Market data visualization
│   ├── trading/         # Bid placement and simulation
│   ├── common/          # Shared components
│   ├── layout/          # Application structure
│   └── ui/              # Base UI primitives
├── pages/               # Top-level route components
├── contexts/            # React Context for global state
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and API client
├── types/               # TypeScript type definitions
└── layouts/             # Layout components
```

#### Backend Structure (`server/`)

```
server/
├── app.js               # Express app factory
├── index.js             # Development server entry point
├── config/
│   └── services.js      # Unified service initialization
├── controllers/         # Request handlers and business logic
├── middleware/          # Request processing (auth, validation, logging)
├── routes/              # API endpoint definitions
├── services/            # Core business services
│   ├── gridstatus.js    # CAISO market data client
│   ├── dataCache.js     # Intelligent caching system
│   ├── llmClient.js     # Multi-provider LLM integration
│   └── spikeAnalyzer.js # Price spike detection algorithms
└── utils/               # Helper functions and utilities
```

### Key Architectural Decisions

#### Unified Service Layer

The `server/config/services.js` automatically detects the environment and initializes services accordingly:

- Express environment: Full server with persistent connections
- Netlify Functions: Serverless with automatic service initialization
- Same API surface regardless of deployment environment

#### State Management Strategy

- **Global State**: React Context for shared app state (selected date)
- **Server State**: React Query for API data with automatic caching
- **Local State**: React hooks for component-specific state
- **Form State**: React Hook Form for validation and submission

#### API Design Patterns

- RESTful endpoints with consistent error handling
- Timezone-aware data processing (Pacific Time → User timezone)
- Intelligent caching to respect GridStatus.io rate limits
- Structured error responses with user-friendly messages

### Data Flow Architecture

1. **User Interaction** → Context update (selected date)
2. **Context Change** → React Query refetch market data
3. **API Request** → Backend controllers validate and process
4. **Service Layer** → GridStatus.io API or cache lookup
5. **Data Transform** → Timezone conversion and quality validation
6. **Response** → Structured JSON with metadata
7. **Frontend Update** → Charts and components re-render

### Component Patterns

#### Domain-Based Organization

Components are organized by feature domain rather than technical type:

- `analysis/` - AI-powered market analysis
- `dashboard/` - Market data visualization
- `trading/` - Bid placement and simulation

#### Consistent Patterns

- Props down, events up communication
- Custom hooks for reusable logic
- TypeScript interfaces for all data structures
- Error boundaries for graceful error handling

## Data Sources

### Primary: GridStatus.io API

- **Day-Ahead Prices**: Hourly CAISO day-ahead market prices
- **Real-Time Prices**: 5-minute interval CAISO real-time prices
- **Rate Limits**: Managed through intelligent caching (1M rows/month on free tier)
