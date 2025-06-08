export interface PriceSpike {
  id: string;
  timestamp: string;
  location: string;
  price: number;
  baselinePrice: number;
  magnitude: number;
  type: 'positive' | 'negative';
  severity: 'low' | 'medium' | 'high' | 'critical';
  nearbyLocations: Array<{
    location: string;
    price: number;
    distance: number;
  }>;
  confidence: number;
  zScore?: number;
  aiAnalysis?: string;
  rootCause?: string;
  technicalDetails?: {
    transmissionImpact: string;
    marketMechanism: string;
    spatialPattern: string;
  };
  recommendations?: string[];
}

export interface GridEvent {
  id: string;
  timestamp: string;
  type: 'transmission_outage' | 'generation_trip' | 'load_spike' | 'congestion' | 'renewable_curtailment';
  description: string;
  affectedLocations: string[];
  estimatedImpact: number;
  severity?: 'low' | 'medium' | 'high';
  confidence?: number;
  duration?: number;
}

export interface AIProvider {
  label: string;
  models: Array<{
    id: string;
    name: string;
  }>;
}

export interface LLMConfig {
  provider: string;
  model: string;
}

export interface AnalysisThresholds {
  minMagnitude: number;
  minDuration: number;
  spatialRadius: number;
  zScoreThreshold?: number;
}

export interface SpikeAnalysisResult {
  spikes: PriceSpike[];
  gridEvents: GridEvent[];
  metadata: {
    totalSpikes: number;
    criticalSpikes: number;
    gridEvents: number;
  };
}