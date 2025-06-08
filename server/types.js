export const LLMProviders = {
  GOOGLE: 'google',
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  TOGETHER: 'together'
};

export const providers = {
  google: {
    label: 'Google Gemini',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
    ]
  },
  openai: {
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4O Mini' },
      { id: 'gpt-4o', name: 'GPT-4O' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
    ]
  },
  anthropic: {
    label: 'Anthropic Claude',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
    ]
  },
  together: {
    label: 'Together AI',
    models: [
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'Llama 3.1 70B' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'Llama 3.1 8B' },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B' }
    ]
  }
};