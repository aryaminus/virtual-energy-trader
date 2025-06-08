/**
 * Simulate bid execution and profit calculation
 * @param {Array} bids - Array of user bids
 * @param {Array} dayAheadPrices - Day-ahead price data
 * @param {Array} realTimePrices - Real-time price data
 * @returns {Object} Simulation results with trades and total profit
 */
export const simulateTradeExecution = (bids, dayAheadPrices, realTimePrices) => {
  const results = [];
  let totalProfit = 0;
  
  bids.forEach(bid => {
    const hourData = dayAheadPrices.find(d => d.hour === bid.hour);
    const rtData = realTimePrices.find(r => r.hour === bid.hour);
    
    if (!hourData || !rtData) {
      results.push({
        ...bid,
        executed: false,
        profit: 0,
        error: 'No market data available for this hour'
      });
      return;
    }
    
    const daPrice = hourData.price;
    const avgRtPrice = rtData.prices.reduce((sum, p) => sum + p.price, 0) / rtData.prices.length;
    
    let executed = false;
    let profit = 0;
    
    // Execute bid based on market rules
    if (bid.type === 'buy' && bid.price >= daPrice) {
      executed = true;
      profit = (avgRtPrice - daPrice) * bid.quantity;
    } else if (bid.type === 'sell' && bid.price <= daPrice) {
      executed = true;
      profit = (daPrice - avgRtPrice) * bid.quantity;
    }
    
    if (executed) {
      totalProfit += profit;
      results.push({
        ...bid,
        executed: true,
        executionPrice: daPrice,
        avgRealTimePrice: avgRtPrice,
        profit,
        profitPerMWh: profit / bid.quantity
      });
    } else {
      results.push({
        ...bid,
        executed: false,
        profit: 0,
        reason: bid.type === 'buy' 
          ? `Bid price $${bid.price} below market price $${daPrice.toFixed(2)}`
          : `Bid price $${bid.price} above market price $${daPrice.toFixed(2)}`
      });
    }
  });
  
  return { 
    trades: results, 
    totalProfit,
    summary: {
      totalBids: bids.length,
      executedTrades: results.filter(r => r.executed).length,
      successRate: (results.filter(r => r.executed).length / bids.length) * 100,
      avgProfitPerTrade: results.filter(r => r.executed).length > 0 
        ? totalProfit / results.filter(r => r.executed).length 
        : 0
    }
  };
};

/**
 * Calculate portfolio risk metrics
 * @param {Array} trades - Executed trades
 * @returns {Object} Risk metrics
 */
export const calculateRiskMetrics = (trades) => {
  const executedTrades = trades.filter(t => t.executed);
  
  if (executedTrades.length === 0) {
    return {
      var95: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      volatility: 0
    };
  }
  
  const profits = executedTrades.map(t => t.profit);
  const avgProfit = profits.reduce((sum, p) => sum + p, 0) / profits.length;
  
  // Calculate volatility
  const variance = profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length;
  const volatility = Math.sqrt(variance);
  
  // Calculate VaR (95% confidence)
  const sortedProfits = [...profits].sort((a, b) => a - b);
  const var95Index = Math.floor(profits.length * 0.05);
  const var95 = sortedProfits[var95Index] || 0;
  
  // Calculate max drawdown
  let peak = profits[0];
  let maxDrawdown = 0;
  let cumulativeProfit = 0;
  
  profits.forEach(profit => {
    cumulativeProfit += profit;
    peak = Math.max(peak, cumulativeProfit);
    const drawdown = peak - cumulativeProfit;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });
  
  // Calculate Sharpe ratio (assuming risk-free rate of 0)
  const sharpeRatio = volatility > 0 ? avgProfit / volatility : 0;
  
  return {
    var95,
    maxDrawdown,
    sharpeRatio,
    volatility,
    avgProfit,
    totalProfit: profits.reduce((sum, p) => sum + p, 0)
  };
};

/**
 * Validate bid parameters
 * @param {Object} bid - Bid object to validate
 * @returns {Object} Validation result
 */
export const validateBid = (bid) => {
  const errors = [];
  
  if (!bid.id || typeof bid.id !== 'string') {
    errors.push('Bid ID is required and must be a string');
  }
  
  if (typeof bid.hour !== 'number' || bid.hour < 0 || bid.hour > 23) {
    errors.push('Hour must be a number between 0 and 23');
  }
  
  if (!['buy', 'sell'].includes(bid.type)) {
    errors.push('Type must be either "buy" or "sell"');
  }
  
  if (typeof bid.price !== 'number' || bid.price < 0) {
    errors.push('Price must be a positive number');
  }
  
  if (typeof bid.quantity !== 'number' || bid.quantity <= 0) {
    errors.push('Quantity must be a positive number');
  }
  
  // Check for reasonable limits
  if (bid.price > 10000) {
    errors.push('Price seems unreasonably high (>$10,000/MWh)');
  }
  
  if (bid.quantity > 1000) {
    errors.push('Quantity seems unreasonably high (>1000 MWh)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};