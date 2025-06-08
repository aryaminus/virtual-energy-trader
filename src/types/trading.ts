export interface Bid {
  id: string;
  hour: number;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
}

export interface TradeResult extends Bid {
  executed: boolean;
  executionPrice?: number;
  avgRealTimePrice?: number;
  profit: number;
  profitPerMWh?: number;
  reason?: string;
}

export interface SimulationResult {
  trades: TradeResult[];
  totalProfit: number;
  summary: {
    totalBids: number;
    executedTrades: number;
    successRate: number;
    avgProfitPerTrade: number;
  };
}

export interface TradingMetrics {
  totalProfit: number;
  executedTrades: number;
  successRate: number;
  avgProfitPerTrade: number;
}