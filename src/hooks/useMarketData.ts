import { useQuery } from '@tanstack/react-query';
import { marketApi } from '../lib/api';
import type { MarketData } from '../types/market';

export const useMarketData = (date: string) => {
  return useQuery<MarketData>({
    queryKey: ['marketData', date],
    queryFn: () => marketApi.getMarketData(date),
    enabled: !!date,
    staleTime: 30 * 60 * 1000, // 30 minutes - longer to reduce API calls
    gcTime: 60 * 60 * 1000, // 1 hour - keep data longer in cache
    retry: (failureCount, error: any) => {
      // Don't retry on client errors (4xx) or specific server errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      if (error?.response?.status === 503) {
        return false; // Don't retry on service unavailable
      }
      if (error?.response?.status === 429) {
        return false; // Don't retry on rate limit
      }
      return failureCount < 1; // Only retry once for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};