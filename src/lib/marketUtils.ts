import type { MarketData, MarketPrice, HourlyRealTimeData } from '../types/market';

export interface MarketStats {
  avgDayAhead: number;
  avgRealTime: number;
  maxSpread: number;
  minSpread: number;
  volatility: number;
}

export interface ChartDataPoint {
  hour: number;
  dayAhead: number;
  realTimeAvg: number;
  spread: number;
}

/**
 * Calculate market statistics from price data
 * All calculations use the data as-is (already processed in Pacific Time on server)
 */
export function calculateMarketStats(
  dayAheadPrices: MarketPrice[],
  realTimePrices: HourlyRealTimeData[]
): MarketStats {
  const avgDA = dayAheadPrices.reduce((sum, d) => sum + d.price, 0) / dayAheadPrices.length;
  
  const allRtPrices = realTimePrices.flatMap(hour => hour.prices.map(p => p.price));
  const avgRT = allRtPrices.reduce((sum, p) => sum + p, 0) / allRtPrices.length;
  
  const spreads = dayAheadPrices.map(da => {
    const rtHour = realTimePrices.find(rt => rt.hour === da.hour);
    const avgRtPrice = rtHour 
      ? rtHour.prices.reduce((sum, p) => sum + p.price, 0) / rtHour.prices.length
      : 0;
    return avgRtPrice - da.price;
  });
  
  const maxSpread = Math.max(...spreads);
  const minSpread = Math.min(...spreads);
  const volatility = Math.sqrt(spreads.reduce((sum, s) => sum + s * s, 0) / spreads.length);
  
  return {
    avgDayAhead: avgDA,
    avgRealTime: avgRT,
    maxSpread,
    minSpread,
    volatility,
  };
}

/**
 * Prepare chart data for visualization
 * Data is already in Pacific Time from server processing
 */
export function prepareChartData(marketData: MarketData): ChartDataPoint[] {
  return marketData.dayAheadPrices.map(da => {
    const rtHour = marketData.realTimePrices.find(rt => rt.hour === da.hour);
    const avgRtPrice = rtHour 
      ? rtHour.prices.reduce((sum, p) => sum + p.price, 0) / rtHour.prices.length
      : 0;
    
    return {
      hour: da.hour,
      dayAhead: Math.round(da.price * 100) / 100,
      realTimeAvg: Math.round(avgRtPrice * 100) / 100,
      spread: Math.round((avgRtPrice - da.price) * 100) / 100,
    };
  });
}

/**
 * Format hour for display in local timezone
 * @param hour - Hour number (0-23) from Pacific Time data
 * @param showTimezone - Whether to show timezone info
 */
export function formatHourForDisplay(hour: number, showTimezone: boolean = false): string {
  const baseTime = `${hour.toString().padStart(2, '0')}:00`;
  
  if (showTimezone) {
    // Note: Data is in Pacific Time but we show it as-is for consistency
    return `${baseTime} PT`;
  }
  
  return baseTime;
}

/**
 * Get current time in user's local timezone for deadline calculations
 */
export function getCurrentLocalTime(): Date {
  return new Date();
}

/**
 * Check if a date is today in user's local timezone
 */
export function isToday(dateString: string): boolean {
  const today = new Date();
  const checkDate = new Date(dateString + 'T00:00:00'); // Treat as local date
  return today.toDateString() === checkDate.toDateString();
}

/**
 * Format date for display in user's local timezone
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString + 'T00:00:00'); // Treat as local date
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}