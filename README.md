# Virtual Energy Trader

A comprehensive energy trading simulation platform that allows users to experience CAISO electricity market dynamics through historical data analysis and bid placement simulation.

## Production Deployment

### Full-Stack Deployment on Netlify

The application is deployed as a full-stack application on Netlify using Netlify Functions to run the Express.js backend as serverless functions.

**Live Demo**: [https://fabulous-llama-19a021.netlify.app](https://fabulous-llama-19a021.netlify.app)

**API Health Check**: [https://fabulous-llama-19a021.netlify.app/api/health](https://fabulous-llama-19a021.netlify.app/api/health)

### Environment Variables Required

To enable full functionality, configure these environment variables in your Netlify deployment:

**Required:**

- `GRIDSTATUS_API_KEY` - Your GridStatus.io API key for real market data

**Optional (for AI Analysis features):**

- `OPENAI_API_KEY` - OpenAI API key for GPT models
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude models  
- `GOOGLE_API_KEY` - Google API key for Gemini models
- `TOGETHER_API_KEY` - Together AI API key for open-source models

### Deployment Architecture

- **Frontend**: React SPA served from Netlify CDN
- **Backend**: Express.js API running as Netlify Functions (serverless)
- **Data**: Real-time fetching from GridStatus.io API with intelligent caching
- **AI**: Optional LangChain integration with multiple LLM providers

## Installation & Setup

### Prerequisites

1. **GridStatus.io API Key**: Sign up at [gridstatus.io](https://www.gridstatus.io/) for a free API key
2. **Node.js**: Version 18 or higher

### Setup Instructions

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your GridStatus.io API key:
# GRIDSTATUS_API_KEY=your_api_key_here

# Start the development server (runs both frontend and backend)
npm run dev
```

The application will be available at `http://localhost:5173` with the API server running on `http://localhost:3001`.

### Environment Variables

Create a `.env` file in the root directory:

```env
# GridStatus.io API Configuration
GRIDSTATUS_API_KEY=your_api_key_here
GRIDSTATUS_BASE_URL=https://api.gridstatus.io

# Server Configuration
PORT=3001
NODE_ENV=development
```

## How to Use

1. **Select a Date**: Choose a historical date for simulation (yesterday or earlier)
2. **Analyze Market Data**: Review day-ahead and real-time price patterns in the Dashboard
3. **Place Bids**: Switch to Trading Interface and place strategic bids for different hours
4. **Run Simulation**: Execute your trading strategy and see results
5. **Analyze Performance**: Review detailed profit/loss calculations and trading metrics

## Features

### Market Data Dashboard

- **Historical Price Visualization**: Interactive charts displaying day-ahead and real-time electricity prices
- **Market Statistics**: Real-time calculation of average prices, spreads, and volatility metrics
- **Date Selection**: Choose any historical date for market analysis
- **Price Comparison**: Side-by-side visualization of day-ahead vs real-time pricing

### Trading Interface

- **Bid Placement**: Place up to 10 buy/sell bids per hour across 24-hour periods
- **Smart Execution**: Automatic bid execution based on historical day-ahead prices
- **Profit Calculation**: Real-time profit/loss calculation using actual market outcomes
- **Performance Analytics**: Detailed trading results with execution rates and profitability metrics

### Simulation Engine

- **Historical Accuracy**: Uses CAISO market data from gridstatus.io for realistic simulation
- **Risk Management**: Calculates position offsetting in real-time markets
- **Portfolio Analysis**: Hourly and total profit/loss tracking
- **Market Education**: Learn energy trading concepts through hands-on experience

## Trading Logic

### Bid Execution Rules

- **Buy Bids**: Execute when bid price ≥ day-ahead price
- **Sell Bids**: Execute when bid price ≤ day-ahead price
- **Settlement**: All executed positions offset at average real-time price

### Profit Calculation

- **Long Position**: Profit = (RT_avg - DA_price) × quantity
- **Short Position**: Profit = (DA_price - RT_avg) × quantity

## Development Notes

### Comprehensive Documentation

Each major directory contains detailed README files explaining the architecture and patterns:

**Backend Documentation:**

- `server/README.md` - Main backend architecture overview
- `server/config/README.md` - Service initialization and configuration
- `server/controllers/README.md` - Business logic layer patterns
- `server/middleware/README.md` - Request processing layer
- `server/routes/README.md` - API endpoint definitions
- `server/services/README.md` - Core business services
- `server/utils/README.md` - Helper functions and utilities

**Frontend Documentation:**

- `src/README.md` - Frontend architecture overview
- `src/components/README.md` - Component organization and patterns
- `src/contexts/README.md` - Global state management
- `src/hooks/README.md` - Custom React hooks
- `src/lib/README.md` - Utility libraries and API client
- `src/pages/README.md` - Top-level page components
- `src/types/README.md` - TypeScript type definitions

**Component Subdirectories:**

- `src/components/analysis/README.md` - AI analysis components
- `src/components/dashboard/README.md` - Market data components
- `src/components/trading/README.md` - Trading interface components
- `src/components/common/README.md` - Shared components
- `src/components/layout/README.md` - Layout components
- `src/components/ui/README.md` - Base UI primitives

### API Integration

- Uses the official GridStatus.io API for real historical market data
- Implements intelligent caching to respect rate limits
- Graceful error handling when data is unavailable

### Performance Optimization

- Data caching reduces API calls and improves response times
- Efficient state management in React components
- Optimized chart rendering for large datasets

### Error Handling

- Comprehensive error handling for API failures
- User-friendly error messages and retry options
- Logging for debugging and monitoring

## Built for Bolt Hackathon 2025

This project demonstrates modern web development practices while providing educational value in energy markets. The application showcases:

- Full-stack development with React and Node.js
- Real-time data visualization
- Complex business logic implementation
- Professional UI/UX design
- Educational technology applications
- Integration with real-world energy market APIs

**⚡ Built on Bolt** - Showcasing the power of modern web development for energy market education.

## Educational Value

This simulator provides hands-on experience with:

- Energy market fundamentals
- Price volatility and risk management
- Arbitrage opportunities between day-ahead and real-time markets
- Portfolio optimization strategies
- Market timing and bid placement strategies

## License

This project is developed for educational purposes and the Bolt Hackathon 2025.
