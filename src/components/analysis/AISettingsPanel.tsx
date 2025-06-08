import React from 'react';
import { Brain, Settings } from 'lucide-react';
import { LLMConfig, AIProvider } from '../../types/analysis';

interface AISettingsPanelProps {
  showSettings: boolean;
  onToggleSettings: () => void;
  llmConfig: LLMConfig;
  onConfigChange: (config: LLMConfig) => void;
  availableProviders: Record<string, AIProvider>;
}

const AISettingsPanel: React.FC<AISettingsPanelProps> = ({
  showSettings,
  onToggleSettings,
  llmConfig,
  onConfigChange,
  availableProviders,
}) => {
  const handleProviderChange = (provider: string) => {
    const defaultModel = availableProviders[provider]?.models[0]?.id || '';
    onConfigChange({ provider, model: defaultModel });
  };

  const handleModelChange = (model: string) => {
    onConfigChange({ ...llmConfig, model });
  };

  return (
    <>
      <button
        onClick={onToggleSettings}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
      >
        <Settings className="w-4 h-4" />
        AI Settings
      </button>

      {showSettings && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Analysis Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
              <select
                value={llmConfig.provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Provider</option>
                {Object.entries(availableProviders).map(([key, provider]) => (
                  <option key={key} value={key}>{provider.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <select
                value={llmConfig.model}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={!llmConfig.provider}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              >
                <option value="">Select Model</option>
                {llmConfig.provider && availableProviders[llmConfig.provider]?.models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {Object.keys(availableProviders).length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No AI providers configured. Please add API keys to your .env file:
              </p>
              <ul className="text-xs text-yellow-700 mt-2 space-y-1">
                <li>• OPENAI_API_KEY for OpenAI models</li>
                <li>• ANTHROPIC_API_KEY for Claude models</li>
                <li>• GOOGLE_API_KEY for Gemini models</li>
                <li>• TOGETHER_API_KEY for Together AI models</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AISettingsPanel;