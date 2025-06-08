import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { analysisApi } from '../lib/api';
import type { PriceSpike, GridEvent, AIProvider, LLMConfig } from '../types/analysis';

export const useSpikeAnalysis = () => {
  const [spikes, setSpikes] = useState<PriceSpike[]>([]);
  const [gridEvents, setGridEvents] = useState<GridEvent[]>([]);
  const [llmConfig, setLLMConfig] = useState<LLMConfig>({ provider: '', model: '' });
  const [showAISettings, setShowAISettings] = useState(false);

  // Load available AI providers with longer cache time
  const { data: availableProviders = {} } = useQuery<Record<string, AIProvider>>({
    queryKey: ['aiProviders'],
    queryFn: analysisApi.getAIProviders,
    retry: false, // Don't retry if AI providers are not available
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });

  // Set default provider when providers are loaded
  useEffect(() => {
    const providerKeys = Object.keys(availableProviders);
    if (providerKeys.length > 0 && !llmConfig.provider) {
      const defaultProvider = providerKeys[0];
      const defaultModel = availableProviders[defaultProvider].models[0]?.id || '';
      setLLMConfig({ provider: defaultProvider, model: defaultModel });
    }
  }, [availableProviders, llmConfig.provider]);

  // Spike detection mutation with rate limit handling
  const spikeDetectionMutation = useMutation({
    mutationFn: (date: string) => analysisApi.detectSpikes(date),
    onSuccess: (result) => {
      setSpikes(result.spikes || []);
      setGridEvents(result.gridEvents || []);
      toast.success(`Detected ${result.spikes?.length || 0} price spikes`);
    },
    onError: (error: any) => {
      console.error('Spike detection error:', error);
      
      // Extract error message
      const errorResponse = error?.response;
      const status = errorResponse?.status;
      const message = errorResponse?.data?.error || error.message || 'Spike detection failed';
      
      if (status === 503) {
        toast.error('GridStatus API not configured. Please check your API key.');
      } else if (status === 404) {
        toast.error('No market data available for the selected date.');
      } else if (status === 429) {
        toast.error('API rate limit exceeded. Please wait before trying again.');
      } else {
        toast.error(`Spike detection failed: ${message}`);
      }
    },
    retry: false, // Don't auto-retry to avoid hitting rate limits
  });

  // AI analysis mutation with rate limit handling
  const aiAnalysisMutation = useMutation({
    mutationFn: ({ spike, contextData }: { spike: PriceSpike; contextData: any }) =>
      analysisApi.analyzeWithAI(spike, contextData, llmConfig),
    onSuccess: (result, variables) => {
      setSpikes(prev => prev.map(s => 
        s.id === variables.spike.id 
          ? { ...s, ...result }
          : s
      ));
      toast.success('AI analysis completed');
    },
    onError: (error: any) => {
      console.error('AI analysis error:', error);
      
      const errorResponse = error?.response;
      const status = errorResponse?.status;
      const message = errorResponse?.data?.error || error.message || 'AI analysis failed';
      
      if (status === 401) {
        toast.error('Invalid AI provider API key. Please check your configuration.');
      } else if (status === 429) {
        toast.error('AI provider rate limit exceeded. Please try again later.');
      } else {
        toast.error(`AI analysis failed: ${message}`);
      }
    },
    retry: false, // Don't auto-retry to avoid hitting rate limits
  });

  const detectSpikes = (date: string) => {
    if (!date) {
      toast.error('Please select a date for analysis');
      return;
    }
    
    // Check if already analyzing to prevent multiple simultaneous requests
    if (spikeDetectionMutation.isPending) {
      toast.error('Analysis already in progress. Please wait.');
      return;
    }
    
    spikeDetectionMutation.mutate(date);
  };

  const analyzeWithAI = (spike: PriceSpike) => {
    if (!llmConfig.provider || !llmConfig.model) {
      toast.error('Please configure AI provider and model in settings');
      setShowAISettings(true);
      return;
    }

    // Check if already analyzing to prevent multiple simultaneous requests
    if (aiAnalysisMutation.isPending) {
      toast.error('AI analysis already in progress. Please wait.');
      return;
    }

    const contextData = {
      nearbySpikes: spikes.filter(s => 
        s.id !== spike.id && 
        Math.abs(new Date(s.timestamp).getTime() - new Date(spike.timestamp).getTime()) < 3600000
      ),
      gridEvents: gridEvents.filter(e =>
        Math.abs(new Date(e.timestamp).getTime() - new Date(spike.timestamp).getTime()) < 1800000
      ),
    };

    aiAnalysisMutation.mutate({ spike, contextData });
  };

  return {
    spikes,
    gridEvents,
    availableProviders,
    llmConfig,
    isAnalyzing: spikeDetectionMutation.isPending || aiAnalysisMutation.isPending,
    showAISettings,
    setShowAISettings,
    setLLMConfig,
    detectSpikes,
    analyzeWithAI,
  };
};