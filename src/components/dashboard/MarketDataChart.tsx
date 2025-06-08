import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import { prepareChartData } from '../../lib/marketUtils';
import type { MarketData } from '../../types/market';

interface MarketDataChartProps {
  marketData: MarketData;
}

const MarketDataChart: React.FC<MarketDataChartProps> = ({ marketData }) => {
  const chartData = prepareChartData(marketData);
  
  // Get current hour for reference line (if viewing today)
  const getCurrentHour = () => {
    const now = new Date();
    return now.getHours();
  };
  
  const isToday = () => {
    // This would need the selected date passed as prop, for now assume we can determine from data
    return false; // Simplified for now
  };

  // Custom dot component to show data quality
  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    if (!cx || !cy || !payload) return null;

    let quality = 'actual';
    if (dataKey === 'dayAhead') {
      const daPrice = marketData.dayAheadPrices.find(p => p.hour === payload.hour);
      quality = daPrice?.dataQuality || 'actual';
    } else if (dataKey === 'realTimeAvg') {
      const rtData = marketData.realTimePrices.find(p => p.hour === payload.hour);
      quality = rtData?.dataQuality || 'actual';
    }

    const getColor = (quality: string) => {
      switch (quality) {
        case 'actual': return '#10b981'; // green
        case 'interpolated': return '#f59e0b'; // yellow
        case 'fallback': return '#ef4444'; // red
        default: return '#6b7280'; // gray
      }
    };

    const getSize = (quality: string) => {
      switch (quality) {
        case 'actual': return 6;
        case 'interpolated': return 5;
        case 'fallback': return 4;
        default: return 4;
      }
    };

    return (
      <Dot 
        cx={cx} 
        cy={cy} 
        r={getSize(quality)} 
        fill={getColor(quality)}
        stroke={getColor(quality)}
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Hourly Price Comparison</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            label={{ value: 'Price ($/MWh)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number, name: string, props: any) => {
              const hour = props.payload.hour;
              let qualityInfo = '';
              let recordInfo = '';
              
              if (name === 'dayAhead') {
                const daPrice = marketData.dayAheadPrices.find(p => p.hour === hour);
                if (daPrice?.dataQuality) {
                  qualityInfo = ` (${daPrice.dataQuality})`;
                }
                if (daPrice?.recordCount !== undefined) {
                  recordInfo = ` - ${daPrice.recordCount} records`;
                }
              } else if (name === 'realTimeAvg') {
                const rtData = marketData.realTimePrices.find(p => p.hour === hour);
                if (rtData?.dataQuality) {
                  qualityInfo = ` (${rtData.dataQuality})`;
                }
                if (rtData?.recordCount !== undefined) {
                  recordInfo = ` - ${rtData.recordCount} records`;
                }
              }
              
              return [`$${value.toFixed(2)}${qualityInfo}${recordInfo}`, name === 'dayAhead' ? 'Day-Ahead' : 'Real-Time Avg'];
            }}
            labelFormatter={(hour: number) => `Hour ${hour}:00`}
          />
          <Legend />
          
          {isToday() && (
            <ReferenceLine 
              x={getCurrentHour()} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              label={{ value: "Current Hour", position: "top" }}
            />
          )}
          
          <Line 
            type="monotone" 
            dataKey="dayAhead" 
            stroke="#2563eb" 
            strokeWidth={3}
            dot={<CustomDot dataKey="dayAhead" />}
            activeDot={{ r: 8, fill: '#2563eb' }}
            name="Day-Ahead"
          />
          <Line 
            type="monotone" 
            dataKey="realTimeAvg" 
            stroke="#059669" 
            strokeWidth={3}
            dot={<CustomDot dataKey="realTimeAvg" />}
            activeDot={{ r: 8, fill: '#059669' }}
            strokeDasharray="5 5"
            name="Real-Time Avg"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Enhanced Data Quality Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Data Quality Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-500"></div>
            <span className="text-sm text-gray-600">
              <strong>Actual:</strong> Real market data from GridStatus API
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-yellow-500"></div>
            <span className="text-sm text-gray-600">
              <strong>Interpolated:</strong> Calculated from adjacent hours
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-500"></div>
            <span className="text-sm text-gray-600">
              <strong>Fallback:</strong> Default/projected values
            </span>
          </div>
        </div>
        
        {/* Data Quality Summary */}
        {marketData.metadata && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {marketData.metadata?.actualHours?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Actual Hours</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {marketData.metadata?.interpolatedHours?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Interpolated Hours</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {marketData.metadata?.fallbackHours?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Fallback Hours</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketDataChart;