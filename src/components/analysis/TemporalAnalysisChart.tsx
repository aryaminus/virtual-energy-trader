import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { Clock } from 'lucide-react';
import { PriceSpike } from '../../types/analysis';

interface TemporalAnalysisChartProps {
  spikes: PriceSpike[];
}

const TemporalAnalysisChart: React.FC<TemporalAnalysisChartProps> = ({ spikes }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const prepareTemporalData = () => {
    // Group spikes by hour and calculate statistics
    const hourlyData: { [hour: number]: { spikes: PriceSpike[]; maxMagnitude: number; count: number } } = {};
    
    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { spikes: [], maxMagnitude: 0, count: 0 };
    }
    
    // Group spikes by hour
    spikes.forEach(spike => {
      const hour = new Date(spike.timestamp).getHours();
      hourlyData[hour].spikes.push(spike);
      hourlyData[hour].maxMagnitude = Math.max(hourlyData[hour].maxMagnitude, spike.magnitude);
      hourlyData[hour].count++;
    });
    
    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      count: data.count,
      maxMagnitude: data.maxMagnitude,
      avgMagnitude: data.spikes.length > 0 
        ? data.spikes.reduce((sum, s) => sum + s.magnitude, 0) / data.spikes.length 
        : 0,
      spikes: data.spikes
    }));
  };

  const prepareScatterData = () => {
    return spikes.map(spike => ({
      hour: new Date(spike.timestamp).getHours() + (new Date(spike.timestamp).getMinutes() / 60),
      magnitude: spike.magnitude,
      severity: spike.severity,
      location: spike.location,
      price: spike.price,
      timestamp: spike.timestamp
    }));
  };

  const temporalData = prepareTemporalData();
  const scatterData = prepareScatterData();

  if (spikes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          Temporal Analysis
        </h3>
        <div className="text-center py-8 text-gray-500">
          No price spike data available for temporal analysis
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-green-600" />
        Temporal Analysis of Price Spikes
      </h3>
      
      {/* Hourly Spike Count Chart */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Spike Frequency by Hour</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={temporalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="hour" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Number of Spikes', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string) => [
                value,
                name === 'count' ? 'Spike Count' : 'Avg Magnitude'
              ]}
              labelFormatter={(hour: number) => `Hour ${hour}:00`}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#059669" 
              strokeWidth={3}
              dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#059669' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Spike Magnitude Scatter Plot */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Spike Magnitude Distribution</h4>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={scatterData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number"
              dataKey="hour" 
              domain={[0, 24]}
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Hour of Day', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number"
              dataKey="magnitude" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Spike Magnitude ($)', angle: -90, position: 'insideLeft' }}
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
              labelFormatter={(hour: number) => `Hour ${hour.toFixed(1)}`}
            />
            <Scatter dataKey="magnitude">
              {scatterData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getSeverityColor(entry.severity)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{spikes.length}</div>
          <div className="text-sm text-gray-600">Total Spikes</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">
            {temporalData.reduce((max, hour) => Math.max(max, hour.count), 0)}
          </div>
          <div className="text-sm text-gray-600">Peak Hour Count</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">
            ${Math.max(...spikes.map(s => s.magnitude)).toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Max Magnitude</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">
            ${(spikes.reduce((sum, s) => sum + s.magnitude, 0) / spikes.length).toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Avg Magnitude</div>
        </div>
      </div>
    </div>
  );
};

export default TemporalAnalysisChart;