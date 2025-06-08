# Virtual Energy Trader

A comprehensive energy trading simulation platform that allows users to experience CAISO electricity market dynamics through historical data analysis and bid placement simulation.

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

## Technical Architecture

### Frontend
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** for responsive, professional styling
- **Recharts** for interactive data visualization
- **Lucide React** for consistent iconography

### Backend
- **Node.js/Express** API server for simulation logic
- **GridStatus.io Integration** for real CAISO market data
- **Data Caching** to manage API rate limits efficiently
- **RESTful API** design for clean data flow
- **CORS-enabled** for seamless frontend integration

### Data Integration
- **GridStatus.io API**: Real historical CAISO market data
- **Rate Limit Management**: Smart caching to stay within API limits
- **Error Handling**: Graceful degradation for data unavailability

### Key Components
- `Dashboard.tsx`: Market data visualization and analysis
- `TradingInterface.tsx`: Bid placement and simulation management
- `server/index.js`: API endpoints and trading simulation logic
- `server/gridstatus.js`: GridStatus.io API client
- `server/dataCache.js`: Intelligent data caching system

## Production Deployment

### Full-Stack Deployment on Netlify

The application is deployed as a full-stack application on Netlify using Netlify Functions to run the Express.js backend as serverless functions.

**Live Demo**: [https://fabulous-llama-19a021.netlify.app](https://fabulous-llama-19a021.netlify.app)

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
npm run dev:all
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

## Trading Logic

### Bid Execution Rules
- **Buy Bids**: Execute when bid price ≥ day-ahead price
- **Sell Bids**: Execute when bid price ≤ day-ahead price
- **Settlement**: All executed positions offset at average real-time price

### Profit Calculation
- **Long Position**: Profit = (RT_avg - DA_price) × quantity
- **Short Position**: Profit = (DA_price - RT_avg) × quantity

## API Endpoints

### Market Data
- `GET /api/market-data/:date` - Fetch historical market data for a specific date
- `GET /api/health` - Check API health and configuration status
- `GET /api/cache/stats` - View cache statistics
- `DELETE /api/cache` - Clear data cache

### Trading Simulation
- `POST /api/simulate-trades` - Run trading simulation with user bids

## Data Sources

### Primary: GridStatus.io API
- **Day-Ahead Prices**: Hourly CAISO day-ahead market prices
- **Real-Time Prices**: 5-minute interval CAISO real-time prices
- **Rate Limits**: Managed through intelligent caching (1M rows/month on free tier)

## Educational Value

This simulator provides hands-on experience with:
- Energy market fundamentals
- Price volatility and risk management
- Arbitrage opportunities between day-ahead and real-time markets
- Portfolio optimization strategies
- Market timing and bid placement strategies

## Built for Bolt Hackathon 2025

This project demonstrates modern web development practices while providing educational value in energy markets. The application showcases:
- Full-stack development with React and Node.js
- Real-time data visualization
- Complex business logic implementation
- Professional UI/UX design
- Educational technology applications
- Integration with real-world energy market APIs

## Development Notes

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

---

**⚡ Built on Bolt** - Showcasing the power of modern web development for energy market education.

## License

This project is developed for educational purposes and the Bolt Hackathon 2025.