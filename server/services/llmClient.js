import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { HumanMessage } from "@langchain/core/messages";
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';

/**
 * Configuration constants for LLM providers
 */
const PROVIDER_CONFIG = {
  google: {
    label: 'Google Gemini',
    envKey: 'GOOGLE_API_KEY',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' }
    ],
    clientClass: ChatGoogleGenerativeAI,
    defaultConfig: {
      maxOutputTokens: 8192,
      temperature: 0.3,
    }
  },
  openai: {
    label: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4O Mini' },
      { id: 'o3-mini', name: 'O3 Mini' },
      { id: 'o4-mini', name: 'O4 Mini' },
      { id: 'o4-mini-high', name: 'O4 Mini High' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' }
    ],
    clientClass: ChatOpenAI,
    defaultConfig: {
      temperature: 0.3,
      maxTokens: 2000,
    }
  },
  anthropic: {
    label: 'Anthropic Claude',
    envKey: 'ANTHROPIC_API_KEY',
    models: [
      { id: 'claude-3-5-sonnet-latest', name: 'Sonnet 3.5' },
      { id: 'claude-3-7-sonnet-latest', name: 'Sonnet 3.7' },
      { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4' }
    ],
    clientClass: ChatAnthropic,
    defaultConfig: {
      temperature: 0.3,
      maxTokens: 2000,
    }
  },
  together: {
    label: 'Together AI',
    envKey: 'TOGETHER_API_KEY',
    models: [
      { id: 'Qwen/Qwen2.5-7B-Instruct-Turbo', name: 'Qwen 2.5' },
      { id: 'Qwen/Qwen3-235B-A22B-fp8-tput', name: 'Qwen 3' },
      { id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct', name: 'Llama 4' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek Reasoner' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek Chat' }
    ],
    clientClass: ChatTogetherAI,
    defaultConfig: {
      temperature: 0.3,
      maxTokens: 2000,
    }
  }
};

/**
 * Error message patterns for different error types
 */
const ERROR_PATTERNS = {
  authentication: ['API key', 'authentication', 'unauthorized'],
  rateLimit: ['rate limit', 'quota', 'too many requests'],
  modelNotFound: ['model', 'not found', 'invalid model'],
  network: ['network', 'connection', 'timeout']
};

/**
 * Get available AI providers based on environment variables
 */
export const getAvailableProviders = () => {
  const available = {};
  
  Object.entries(PROVIDER_CONFIG).forEach(([key, config]) => {
    if (process.env[config.envKey]) {
      available[key] = {
        label: config.label,
        models: config.models
      };
    }
  });
  
  logger.info(`🤖 Available AI providers: ${Object.keys(available).join(', ')}`);
  return available;
};

/**
 * Validate LLM configuration
 */
const validateLLMConfig = (config) => {
  if (!config || !config.provider || !config.model) {
    throw new ApiError('LLM configuration must include provider and model', 400);
  }

  if (!PROVIDER_CONFIG[config.provider]) {
    throw new ApiError(`Unsupported AI provider: ${config.provider}`, 400);
  }

  const apiKey = process.env[PROVIDER_CONFIG[config.provider].envKey];
  if (!apiKey) {
    throw new ApiError(`API key not found for ${config.provider}. Please set the appropriate environment variable.`, 401);
  }

  return { config: PROVIDER_CONFIG[config.provider], apiKey };
};

/**
 * Create LLM client instance based on configuration
 */
export const createLLMClient = (config) => {
  const { config: providerConfig, apiKey } = validateLLMConfig(config);

  try {
    const clientConfig = {
      apiKey,
      modelName: config.model,
      ...providerConfig.defaultConfig
    };

    return new providerConfig.clientClass(clientConfig);
  } catch (error) {
    logger.error(`❌ Failed to create LLM client for ${config.provider}:`, error);
    throw new ApiError(`Failed to initialize ${config.provider} client: ${error.message}`, 500);
  }
};

/**
 * Classify error type based on error message
 */
const classifyError = (errorMessage) => {
  const message = errorMessage.toLowerCase();
  
  for (const [type, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (patterns.some(pattern => message.includes(pattern))) {
      return type;
    }
  }
  
  return 'unknown';
};

/**
 * Create appropriate error based on error type and provider
 */
const createProviderError = (error, provider) => {
  const errorType = classifyError(error.message);
  
  switch (errorType) {
    case 'authentication':
      return new ApiError(`Invalid API key for ${provider}`, 401);
    case 'rateLimit':
      return new ApiError(`Rate limit exceeded for ${provider}. Please try again later.`, 429);
    case 'modelNotFound':
      return new ApiError(`Model not available for ${provider}`, 400);
    default:
      return new ApiError(`AI analysis failed: ${error.message}`, 500);
  }
};

/**
 * Parse JSON response with fallback extraction
 */
const parseJSONResponse = (content) => {
  try {
    return JSON.parse(content);
  } catch (parseError) {
    // Try to extract JSON from response if it's wrapped in other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new ApiError('AI response was not in valid JSON format', 500);
  }
};

/**
 * Grid Analysis LLM class for power systems analysis
 */
export class GridAnalysisLLM {
  constructor(config) {
    this.config = config;
    this.client = createLLMClient(config);
    this.provider = config.provider;
    
    logger.info(`🧠 Initialized GridAnalysisLLM with ${config.provider} - ${config.model}`);
  }

  /**
   * Create analysis prompt for price spike
   */
  createSpikeAnalysisPrompt(spike, contextData) {
    const nearbySpikesSection = contextData.nearbySpikes?.length > 0 ? `
Other Spikes Within 1 Hour:
${contextData.nearbySpikes.map(s => `- ${s.location}: $${s.magnitude}/MWh spike at ${s.timestamp}`).join('\n')}
` : '';

    const gridEventsSection = contextData.gridEvents?.length > 0 ? `
Concurrent Grid Events:
${contextData.gridEvents.map(e => `- ${e.type}: ${e.description}`).join('\n')}
` : '';

    return `You are an expert power systems engineer analyzing electricity market price spikes. Analyze the following price anomaly and provide a technical explanation.

Price Spike Details:
- Location: ${spike.location}
- Timestamp: ${spike.timestamp}
- Price: $${spike.price}/MWh (baseline: $${spike.baselinePrice}/MWh)
- Magnitude: $${spike.magnitude}/MWh ${spike.type} spike
- Severity: ${spike.severity}

Nearby Locations (same time):
${spike.nearbyLocations.map(loc => `- ${loc.location}: $${loc.price}/MWh (${loc.distance} miles away)`).join('\n')}

${nearbySpikesSection}${gridEventsSection}

Provide a JSON response with the following structure:
{
  "analysis": "Brief technical explanation for this price spike (2-3 sentences)",
  "rootCause": "Most likely root cause (transmission_constraint|generation_outage|demand_spike|market_manipulation|other)",
  "confidence": number between 0.0-1.0,
  "technicalDetails": {
    "transmissionImpact": "Description of transmission system impact",
    "marketMechanism": "Explanation of market clearing mechanism",
    "spatialPattern": "Analysis of geographic price pattern"
  },
  "recommendations": ["Array of 2-3 operational recommendations"]
}

Focus on transmission constraints, generation outages, demand patterns, and market dynamics. Be concise but technically accurate.`;
  }

  /**
   * Create grid events analysis prompt
   */
  createGridEventsPrompt(spikes, date) {
    return `Analyze the following collection of electricity price spikes to identify potential grid events and transmission issues.

Date: ${date}
Total Spikes: ${spikes.length}

Spike Summary:
${spikes.map(spike => `- ${spike.location} at ${spike.timestamp}: $${spike.magnitude}/MWh ${spike.type} spike (${spike.severity})`).join('\n')}

Provide a JSON response with the following structure:
{
  "gridEvents": [
    {
      "type": "transmission_outage|generation_trip|load_spike|congestion",
      "description": "Technical description of the event",
      "affectedLocations": ["array of location names"],
      "estimatedImpact": number (average price impact in $/MWh),
      "timeWindow": "time range of the event",
      "confidence": number between 0.0-1.0
    }
  ],
  "systemAssessment": {
    "overallStability": "stable|stressed|critical",
    "primaryConcerns": ["array of main issues"],
    "operationalRecommendations": ["array of recommendations"]
  }
}

Focus on identifying transmission line trips, generator outages, and congestion patterns based on the spatial and temporal distribution of price spikes.`;
  }

  /**
   * Invoke LLM with error handling
   */
  async invokeLLM(prompt) {
    try {
      const messages = [new HumanMessage(prompt)];
      const response = await this.client.invoke(messages);
      return response.content;
    } catch (error) {
      logger.error(`❌ LLM invocation error (${this.provider}):`, error.message);
      throw createProviderError(error, this.provider);
    }
  }

  /**
   * Analyze a price spike using AI
   */
  async analyzePriceSpike(spike, contextData) {
    try {
      logger.info(`🔍 Analyzing price spike with ${this.provider} - ${this.config.model}`);
      
      const prompt = this.createSpikeAnalysisPrompt(spike, contextData);
      const content = await this.invokeLLM(prompt);
      const result = parseJSONResponse(content);
      
      logger.info(`✅ AI analysis complete with confidence: ${result.confidence}`);
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw createProviderError(error, this.provider);
    }
  }

  /**
   * Analyze multiple spikes to identify grid events
   */
  async analyzeGridEvents(spikes, date) {
    try {
      logger.info(`🔍 Analyzing grid events with ${this.provider} - ${this.config.model}`);
      
      const prompt = this.createGridEventsPrompt(spikes, date);
      const content = await this.invokeLLM(prompt);
      const result = parseJSONResponse(content);
      
      logger.info(`✅ Grid events analysis complete: ${result.gridEvents?.length || 0} events identified`);
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw createProviderError(error, this.provider);
    }
  }
}