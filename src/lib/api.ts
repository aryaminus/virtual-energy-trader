import type { MarketData } from '../types/market';
import type { Bid, SimulationResult } from '../types/trading';
import type { PriceSpike, GridEvent, AIProvider, LLMConfig } from '../types/analysis';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // In development, use the local server
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api';
  }
  
  // In production (Netlify), use relative path for Functions
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Get user's timezone
const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Add timezone to all requests
    const timezone = getUserTimezone();
    
    // Construct the full URL properly
    let fullUrl: string;
    if (import.meta.env.DEV) {
      // In development, we have a full base URL
      const url = new URL(`${API_BASE_URL}${endpoint}`);
      url.searchParams.set('timezone', timezone);
      fullUrl = url.toString();
    } else {
      // In production, construct the URL manually to avoid URL constructor issues
      const baseUrl = window.location.origin;
      const url = new URL(`${baseUrl}${API_BASE_URL}${endpoint}`);
      url.searchParams.set('timezone', timezone);
      fullUrl = url.toString();
    }
    
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Timezone': timezone,
          ...options?.headers,
        },
        ...options,
      });

      // Check if response is HTML (indicates routing issue)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('API endpoint returned HTML instead of JSON. This indicates a routing issue.');
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const error = new Error(errorData.error || `API request failed: ${response.statusText}`);
        (error as any).response = {
          status: response.status,
          data: errorData
        };
        throw error;
      }

      const data = await response.json();
      
      if (!data.success) {
        const error = new Error(data.error || 'API request failed');
        (error as any).response = {
          status: response.status,
          data
        };
        throw error;
      }

      return data;
    } catch (error) {
      // If it's a network error or parsing error, provide more context
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network error: Unable to connect to API. Please check your internet connection.');
        (networkError as any).response = { status: 503, data: { error: 'Network error' } };
        throw networkError;
      }
      
      // Re-throw the error as-is if it already has response info
      throw error;
    }
  }

  // Market API
  async getMarketData(date: string): Promise<MarketData> {
    const response = await this.request<{ data: MarketData; source: string; metadata?: any }>(`/market/data/${date}`);
    return response.data;
  }

  async getAvailableDatasets(): Promise<any[]> {
    const response = await this.request<{ datasets: any[] }>('/market/datasets');
    return response.datasets;
  }

  // Trading API
  async simulateTrades(bids: Bid[], date: string): Promise<SimulationResult> {
    const response = await this.request<{ simulation: SimulationResult }>('/trading/simulate', {
      method: 'POST',
      body: JSON.stringify({ bids, date }),
    });
    return response.simulation;
  }

  // Analysis API
  async getAIProviders(): Promise<Record<string, AIProvider>> {
    const response = await this.request<{ providers: Record<string, AIProvider> }>('/analysis/ai-providers');
    return response.providers;
  }

  async detectSpikes(date: string): Promise<{ spikes: PriceSpike[]; gridEvents: GridEvent[] }> {
    const response = await this.request<{ spikes: PriceSpike[]; gridEvents: GridEvent[] }>(`/analysis/spikes/${date}`, {
      method: 'POST',
      body: JSON.stringify({
        analysisType: 'detection',
        thresholds: {
          minMagnitude: 0,
          minDuration: 0,
          spatialRadius: 0,
          zScoreThreshold: 0
        },
      }),
    });
    return { spikes: response.spikes || [], gridEvents: response.gridEvents || [] };
  }

  async analyzeWithAI(spike: PriceSpike, contextData: any, llmConfig: LLMConfig): Promise<any> {
    return this.request('/analysis/ai', {
      method: 'POST',
      body: JSON.stringify({ spike, contextData, llmConfig }),
    });
  }

  // Health API
  async getHealth(): Promise<any> {
    return this.request('/health');
  }
}

const apiClient = new ApiClient();

export const marketApi = {
  getMarketData: (date: string) => apiClient.getMarketData(date),
  getAvailableDatasets: () => apiClient.getAvailableDatasets(),
};

export const tradingApi = {
  simulateTrades: (bids: Bid[], date: string) => apiClient.simulateTrades(bids, date),
};

export const analysisApi = {
  getAIProviders: () => apiClient.getAIProviders(),
  detectSpikes: (date: string) => apiClient.detectSpikes(date),
  analyzeWithAI: (spike: PriceSpike, contextData: any, llmConfig: LLMConfig) => 
    apiClient.analyzeWithAI(spike, contextData, llmConfig),
};

export default apiClient;