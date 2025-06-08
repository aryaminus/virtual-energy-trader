# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

**Development:**
- `npm run dev` - Start both frontend (port 5173) and backend (port 3001) concurrently
- `npm run dev:client` - Start only the frontend development server
- `npm run dev:server` - Start only the backend Express server
- `npm run build` - Build the React frontend for production
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview the built application locally

**Environment Setup:**
```bash
cp .env.example .env
# Edit .env and add your GridStatus.io API key
```

## Architecture Overview

### Full-Stack Structure
This is a React + Express.js application that simulates energy trading using real CAISO market data. The app has dual deployment modes:
- **Development**: Frontend (React/Vite) + separate Express server
- **Production**: Static frontend + serverless Express via Netlify Functions

### Frontend (React + TypeScript)
- **Pages**: Dashboard (market data), Trading (bid placement), Analysis (AI insights)
- **State Management**: React Context (`AppContext`) for global state, React Query for server state
- **Key Context**: `selectedDate` is managed globally via `AppContext.tsx` - this drives all market data fetching
- **API Layer**: All backend calls go through `src/lib/api.ts` with proxy to `/api/*` endpoints

### Backend (Express.js)
- **Entry Point**: `server/index.js` → `server/app.js` (Express app factory)
- **API Structure**: RESTful routes in `server/routes/` with corresponding controllers
- **Unified Services**: `server/config/services.js` - Automatically detects environment (Express/Netlify) and initializes services accordingly
- **Key Services**:
  - `server/services/gridstatus.js` - GridStatus.io API client for CAISO market data
  - `server/services/dataCache.js` - Intelligent caching to manage API rate limits
  - `server/services/llmClient.js` - Multi-provider LLM integration (OpenAI, Anthropic, Google, Together AI)
  - `server/services/spikeAnalyzer.js` - Price spike detection algorithms

### Data Flow Architecture
1. **Market Data**: GridStatus.io API → Cache → Frontend charts
2. **Trading Simulation**: User bids → Backend simulation engine → Results with P&L
3. **AI Analysis**: Market data → LLM providers → Insights and recommendations

### Unified Deployment Architecture
- **Unified Services**: Single `server/config/services.js` handles both development and production environments
- **Environment Detection**: Automatically detects Express vs Netlify Functions environment
- **Local Development**: Uses Vite proxy (`/api` → `http://localhost:3001`)
- **Netlify Production**: Express app runs as serverless function at `/.netlify/functions/api`
- **Configuration**: `netlify.toml` handles routing and redirects
- **No Duplication**: Same service initialization logic works for both environments

## Environment Variables

**Required:**
- `GRIDSTATUS_API_KEY` - GridStatus.io API key for real CAISO market data

**Optional AI Providers (configure at least one for analysis features):**
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `TOGETHER_API_KEY`

**Server:**
- `PORT=3001` (development), `NODE_ENV=development`

## Key Trading Logic
- **Bid Execution**: Bids execute against day-ahead prices, settle at real-time prices
- **P&L Calculation**: Profit = (settlement_price - execution_price) × quantity
- **Market Data**: Uses CAISO zone data from GridStatus.io with 5-minute real-time intervals

## API Endpoints
- `GET /api/market-data/:date` - Historical market data for specific date
- `POST /api/simulate-trades` - Run trading simulation with user bids
- `GET /api/health` - System health and configuration status
- `GET /api/cache/stats` - Cache performance metrics
- `DELETE /api/cache` - Clear data cache