import React from 'react';
import { Zap, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SpikeDetectionPanelProps {
  analysisMode: 'detection' | 'correlation' | 'prediction';
  onAnalysisModeChange: (mode: 'detection' | 'correlation' | 'prediction') => void;
  onDetectSpikes: () => void;
  isLoading: boolean;
}

const SpikeDetectionPanel: React.FC<SpikeDetectionPanelProps> = ({
  analysisMode,
  onAnalysisModeChange,
  onDetectSpikes,
  isLoading,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            Grid Anomaly Detection & Analysis
          </h2>
          <p className="text-gray-600">
            Advanced price spike detection with AI-powered root cause analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={analysisMode}
            onChange={(e) => onAnalysisModeChange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="detection">Spike Detection</option>
            <option value="correlation">Spatial Correlation</option>
            <option value="prediction">Predictive Analysis</option>
          </select>
          
          <button
            onClick={onDetectSpikes}
            disabled={isLoading}
            className={cn(
              "bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2",
              isLoading && "cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Analyze Grid
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpikeDetectionPanel;