export interface MarketPrice {
  hour: number;
  price: number;
  timestamp: string;
  dataQuality?: 'actual' | 'interpolated' | 'fallback';
  recordCount?: number;
  sourceHour?: number; // Original hour in source timezone (Pacific Time)
}

export interface RealTimePrice {
  interval: number;
  price: number;
  timestamp: string;
  dataQuality?: 'actual' | 'fallback';
}

export interface HourlyRealTimeData {
  hour: number;
  prices: RealTimePrice[];
  dataQuality?: 'actual' | 'partial' | 'fallback';
  recordCount?: number;
  sourceHour?: number; // Original hour in source timezone (Pacific Time)
}

export interface MarketData {
  dayAheadPrices: MarketPrice[];
  realTimePrices: HourlyRealTimeData[];
  metadata?: {
    actualHours: number[];
    interpolatedHours: number[];
    fallbackHours: number[];
    totalRecords: {
      dayAhead: number;
      realTime: number;
    };
    dataSource: string;
    timezone: string; // User's timezone
    sourceTimezone?: string; // Original data timezone (Pacific Time)
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: string;
  timezone?: string;
  warning?: string;
  info?: string;
}