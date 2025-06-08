import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import DateSelector from '../components/common/DateSelector';
import SpikeDetectionPanel from '../components/analysis/SpikeDetectionPanel';
import AISettingsPanel from '../components/analysis/AISettingsPanel';
import AnalysisResults from '../components/analysis/AnalysisResults';
import SpatialAnalysisChart from '../components/analysis/SpatialAnalysisChart';
import TemporalAnalysisChart from '../components/analysis/TemporalAnalysisChart';
import { useSpikeAnalysis } from '../hooks/useSpikeAnalysis';

const Analysis: React.FC = () => {
  const { selectedDate, setSelectedDate } = useAppContext();
  const [analysisMode, setAnalysisMode] = useState<'detection' | 'correlation' | 'prediction'>('detection');
  
  const {
    spikes,
    gridEvents,
    availableProviders,
    llmConfig,
    isAnalyzing,
    showAISettings,
    setShowAISettings,
    setLLMConfig,
    detectSpikes,
    analyzeWithAI,
  } = useSpikeAnalysis();

  const handleDetectSpikes = () => {
    if (selectedDate) {
      detectSpikes(selectedDate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Grid Analysis Dashboard</h2>
            <p className="text-gray-600">
              Detect price spikes and analyze grid anomalies using real CAISO market data with AI-powered insights
            </p>
          </div>
          
          <DateSelector
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            label="Analysis Date"
          />
        </div>
      </div>

      {/* Spike Detection Panel */}
      <SpikeDetectionPanel
        analysisMode={analysisMode}
        onAnalysisModeChange={setAnalysisMode}
        onDetectSpikes={handleDetectSpikes}
        isLoading={isAnalyzing}
      />

      {/* AI Settings Panel */}
      <div className="flex justify-end">
        <AISettingsPanel
          showSettings={showAISettings}
          onToggleSettings={() => setShowAISettings(!showAISettings)}
          llmConfig={llmConfig}
          onConfigChange={setLLMConfig}
          availableProviders={availableProviders}
        />
      </div>

      {/* Analysis Results */}
      {spikes.length > 0 && (
        <>
          <AnalysisResults
            spikes={spikes}
            gridEvents={gridEvents}
            onAnalyzeSpike={analyzeWithAI}
            isAnalyzing={isAnalyzing}
            llmConfig={llmConfig}
          />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <TemporalAnalysisChart spikes={spikes} />
            <SpatialAnalysisChart spikes={spikes} />
          </div>
        </>
      )}
    </div>
  );
};

export default Analysis;