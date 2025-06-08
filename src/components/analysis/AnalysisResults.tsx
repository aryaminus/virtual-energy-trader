import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Brain } from 'lucide-react';
import { PriceSpike, GridEvent, LLMConfig } from '../../types/analysis';
import StatCard from '../ui/StatCard';

interface AnalysisResultsProps {
  spikes: PriceSpike[];
  gridEvents: GridEvent[];
  onAnalyzeSpike: (spike: PriceSpike) => void;
  isAnalyzing: boolean;
  llmConfig: LLMConfig;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  spikes,
  gridEvents,
  onAnalyzeSpike,
  isAnalyzing,
  llmConfig,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const prepareTimeSeriesData = () => {
    return spikes.map(spike => ({
      time: new Date(spike.timestamp).getHours(),
      magnitude: spike.magnitude,
      price: spike.price,
      severity: spike.severity,
      location: spike.location
    }));
  };

  const prepareSpatialData = () => {
    return spikes.map((spike, index) => ({
      x: (index % 10) * 10,
      y: Math.floor(index / 10) * 10,
      magnitude: spike.magnitude,
      severity: spike.severity,
      location: spike.location,
      spike
    }));
  };

  if (spikes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-100 text-center">
        <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Price Spikes Detected</h3>
        <p className="text-gray-600 mb-6">
          Select a date and click "Analyze Grid" to detect price anomalies from real market data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Spikes"
          value={spikes.length.toString()}
          icon={AlertTriangle}
          color="blue"
        />
        
        <StatCard
          title="Critical Events"
          value={spikes.filter(s => s.severity === 'critical').length.toString()}
          icon={AlertTriangle}
          color="red"
        />
        
        <StatCard
          title="Max Magnitude"
          value={`$${Math.max(...spikes.map(s => s.magnitude)).toFixed(0)}`}
          icon={TrendingUp}
          color="orange"
        />
        
        <StatCard
          title="AI Analyzed"
          value={spikes.filter(s => s.aiAnalysis).length.toString()}
          icon={Brain}
          color="purple"
        />
      </div>

      {/* Temporal Analysis Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Temporal Price Spike Pattern</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={prepareTimeSeriesData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              stroke="#6b7280"
              label={{ value: 'Price Spike Magnitude ($)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string, props: any) => [
                `$${value.toFixed(2)}`,
                `${props.payload.location} - ${props.payload.severity.toUpperCase()}`
              ]}
              labelFormatter={(hour: number) => `Hour ${hour}:00`}
            />
            <Scatter 
              dataKey="magnitude" 
              fill="#8884d8"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Spatial Analysis */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Spatial Distribution of Price Spikes</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={prepareSpatialData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="x" 
              stroke="#6b7280"
              label={{ value: 'Geographic X-Coordinate', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              stroke="#6b7280"
              label={{ value: 'Geographic Y-Coordinate', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string, props: any) => [
                `Magnitude: $${props.payload.magnitude.toFixed(2)}`,
                `Location: ${props.payload.location}`
              ]}
            />
            <Scatter 
              dataKey="magnitude" 
              fill="#059669"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Spike Analysis */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Detected Price Spikes</h3>
        
        <div className="space-y-4">
          {spikes.map((spike) => (
            <div 
              key={spike.id} 
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getSeverityColor(spike.severity) }}
                  ></div>
                  <span className="font-medium text-gray-900">{spike.location}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(spike.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-bold text-red-600">
                    ${spike.magnitude.toFixed(2)}
                  </span>
                  {!spike.aiAnalysis && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnalyzeSpike(spike);
                      }}
                      disabled={isAnalyzing}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {isAnalyzing ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        <Brain className="w-3 h-3" />
                      )}
                      Analyze
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Price:</span>
                  <span className="ml-2 font-medium">${spike.price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Baseline:</span>
                  <span className="ml-2 font-medium">${spike.baselinePrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className={`ml-2 font-medium ${spike.type === 'positive' ? 'text-red-600' : 'text-blue-600'}`}>
                    {spike.type}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Confidence:</span>
                  <span className="ml-2 font-medium">{(spike.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              {spike.aiAnalysis && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                      AI Analysis ({llmConfig.provider})
                    </span>
                  </div>
                  <p className="text-sm text-purple-700">{spike.aiAnalysis}</p>
                  
                  {spike.rootCause && (
                    <div className="mt-2 text-xs text-purple-600">
                      <strong>Root Cause:</strong> {spike.rootCause.replace('_', ' ')}
                    </div>
                  )}
                  
                  {spike.recommendations && spike.recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-purple-800 mb-1">Recommendations:</div>
                      <ul className="text-xs text-purple-700 space-y-1">
                        {spike.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;