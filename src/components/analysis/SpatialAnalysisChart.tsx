import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin } from 'lucide-react';
import { PriceSpike } from '../../types/analysis';

interface SpatialAnalysisChartProps {
  spikes: PriceSpike[];
}

const SpatialAnalysisChart: React.FC<SpatialAnalysisChartProps> = ({ spikes }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const prepareSpatialData = () => {
    // Create a mock spatial layout for CAISO locations
    const locationCoordinates: { [key: string]: { x: number; y: number } } = {
      'SP15': { x: 20, y: 80 },
      'NP15': { x: 20, y: 20 },
      'ZP26': { x: 50, y: 50 },
      'DLAP_SCE': { x: 30, y: 85 },
      'DLAP_SDGE': { x: 25, y: 95 },
      'DLAP_PGE': { x: 15, y: 30 },
      'TH_SP15_GEN': { x: 25, y: 75 },
      'TH_NP15_GEN': { x: 25, y: 25 },
      'ASR_SP15': { x: 35, y: 80 },
      'ASR_NP15': { x: 35, y: 20 },
      'DLAP_SMUD': { x: 40, y: 35 },
      'DLAP_VEA': { x: 45, y: 40 }
    };

    return spikes.map((spike, index) => {
      const coords = locationCoordinates[spike.location] || { 
        x: 50 + (Math.random() - 0.5) * 40, 
        y: 50 + (Math.random() - 0.5) * 40 
      };
      
      return {
        x: coords.x,
        y: coords.y,
        magnitude: spike.magnitude,
        severity: spike.severity,
        location: spike.location,
        price: spike.price,
        timestamp: spike.timestamp,
        spike
      };
    });
  };

  const spatialData = prepareSpatialData();

  if (spikes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Spatial Distribution
        </h3>
        <div className="text-center py-8 text-gray-500">
          No price spike data available for spatial analysis
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        Spatial Distribution of Price Spikes
      </h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart data={spatialData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number"
            dataKey="x" 
            domain={[0, 100]}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            label={{ value: 'West ← → East', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            type="number"
            dataKey="y" 
            domain={[0, 100]}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            label={{ value: 'South ← → North', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number, name: string, props: any) => {
              const data = props.payload;
              return [
                <div key="tooltip" className="space-y-1">
                  <div className="font-medium">{data.location}</div>
                  <div>Magnitude: ${data.magnitude.toFixed(2)}/MWh</div>
                  <div>Price: ${data.price.toFixed(2)}/MWh</div>
                  <div>Severity: {data.severity.toUpperCase()}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </div>
                </div>,
                ''
              ];
            }}
            labelFormatter={() => ''}
          />
          <Scatter dataKey="magnitude">
            {spatialData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getSeverityColor(entry.severity)}
                r={Math.max(4, Math.min(entry.magnitude / 10, 20))}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600"></div>
          <span className="text-sm text-gray-600">Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-600"></div>
          <span className="text-sm text-gray-600">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
          <span className="text-sm text-gray-600">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600"></div>
          <span className="text-sm text-gray-600">Low</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mt-4 text-center">
        Bubble size represents spike magnitude. Data from GridStatus API for CAISO regions.
      </p>
    </div>
  );
};

export default SpatialAnalysisChart;