# Server - Backend Architecture

The server directory contains the Express.js backend that powers the Virtual Energy Trader application. This backend provides RESTful APIs for market data, trading simulation, and AI-powered analysis.

## Architecture Overview

### Unified Deployment Strategy
- **Development**: Full Express server (`server/index.js`)
- **Production**: Same Express app wrapped with `serverless-http` for Netlify Functions
- **Unified Services**: Single service layer works across both environments via `config/services.js`

### Entry Points
- **`index.js`**: Development server entry point with graceful shutdown
- **`app.js`**: Express app factory function - core application setup
- **`types.js`**: Shared TypeScript-style type definitions for JavaScript

### Core Principles
1. **Environment Agnostic**: Same codebase works in Express and Netlify Functions
2. **Service-Oriented**: Business logic isolated in service classes
3. **Middleware-First**: Request/response processing through modular middleware
4. **Error-Resilient**: Comprehensive error handling and logging

## Request Flow
```
Request → Middleware (CORS, Auth, Logging) → Routes → Controllers → Services → Response
```

## Environment Variables
- `GRIDSTATUS_API_KEY`: Required for CAISO market data
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `TOGETHER_API_KEY`: Optional AI providers
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode

## API Endpoints
- `/api/market/*`: Market data and pricing information
- `/api/trading/*`: Trading simulation and bid execution
- `/api/analysis/*`: AI-powered market analysis
- `/api/health/*`: System health and status
- `/api/cache/*`: Cache management and statistics

## Development Commands
```bash
npm run dev:server    # Start development server
npm run dev          # Start both frontend and backend
```