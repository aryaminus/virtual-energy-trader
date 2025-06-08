import React from 'react';
import { CheckCircle, AlertTriangle, Info, Clock, Globe } from 'lucide-react';
import type { MarketData } from '../../types/market';

interface DataQualityIndicatorProps {
  marketData: MarketData;
  selectedDate: string;
}

const DataQualityIndicator: React.FC<DataQualityIndicatorProps> = ({ marketData, selectedDate }) => {
  if (!marketData.metadata) return null;

  const { actualHours, interpolatedHours, fallbackHours, totalRecords, timezone, sourceTimezone } = marketData.metadata;
  
  const getQualityLevel = () => {
    const actualCount = actualHours.length;
    const totalHours = 24;
    const actualPercentage = (actualCount / totalHours) * 100;
    
    if (actualPercentage >= 80) return 'high';
    if (actualPercentage >= 50) return 'medium';
    return 'low';
  };

  const qualityLevel = getQualityLevel();
  
  const getQualityColor = () => {
    switch (qualityLevel) {
      case 'high': return 'green';
      case 'medium': return 'yellow';
      case 'low': return 'red';
      default: return 'gray';
    }
  };

  const getQualityIcon = () => {
    switch (qualityLevel) {
      case 'high': return CheckCircle;
      case 'medium': return AlertTriangle;
      case 'low': return AlertTriangle;
      default: return Info;
    }
  };

  const color = getQualityColor();
  const Icon = getQualityIcon();

  const isToday = () => {
    const today = new Date();
    const selected = new Date(selectedDate + 'T00:00:00');
    return today.toDateString() === selected.toDateString();
  };

  const isFuture = () => {
    const today = new Date();
    const selected = new Date(selectedDate + 'T00:00:00');
    return selected > today;
  };

  const getTimeContext = () => {
    if (isFuture()) return 'Future Date';
    if (isToday()) return 'Today';
    return 'Historical Data';
  };

  const getUserTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  // Validate data consistency
  const totalHours = actualHours.length + interpolatedHours.length + fallbackHours.length;
  if (totalHours !== 24) {
    console.warn('Data quality hours do not sum to 24:', {
      actual: actualHours.length,
      interpolated: interpolatedHours.length,
      fallback: fallbackHours.length,
      total: totalHours
    });
  }

  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 text-${color}-600 mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-medium text-${color}-900`}>
              Data Quality: {qualityLevel.charAt(0).toUpperCase() + qualityLevel.slice(1)}
            </h4>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getTimeContext()}
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {timezone || getUserTimezone()}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <div className={`text-lg font-bold text-green-600`}>{actualHours.length}</div>
              <div className="text-xs text-gray-600">Actual Hours</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold text-yellow-600`}>{interpolatedHours.length}</div>
              <div className="text-xs text-gray-600">Interpolated</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold text-red-600`}>{fallbackHours.length}</div>
              <div className="text-xs text-gray-600">Fallback</div>
            </div>
          </div>
          
          <div className="text-xs space-y-1">
            <div className={`text-${color}-700`}>
              <strong>Records:</strong> {totalRecords.dayAhead.toLocaleString()} day-ahead, {totalRecords.realTime.toLocaleString()} real-time
            </div>
            
            {timezone && sourceTimezone && timezone !== sourceTimezone && (
              <div className={`text-${color}-700`}>
                <strong>Timezone:</strong> Converted from {sourceTimezone} to {timezone}
              </div>
            )}
            
            {actualHours.length > 0 && (
              <div className={`text-${color}-700`}>
                <strong>Actual data hours:</strong> {actualHours.length > 10 
                  ? `${actualHours.slice(0, 10).sort((a, b) => a - b).join(', ')}... (+${actualHours.length - 10} more)`
                  : actualHours.sort((a, b) => a - b).join(', ')
                }
              </div>
            )}
            
            {interpolatedHours.length > 0 && (
              <div className={`text-${color}-700`}>
                <strong>Interpolated hours:</strong> {interpolatedHours.length > 10 
                  ? `${interpolatedHours.slice(0, 10).sort((a, b) => a - b).join(', ')}... (+${interpolatedHours.length - 10} more)`
                  : interpolatedHours.sort((a, b) => a - b).join(', ')
                }
              </div>
            )}
            
            {fallbackHours.length > 0 && (
              <div className={`text-${color}-700`}>
                <strong>Fallback hours:</strong> {fallbackHours.length > 10 
                  ? `${fallbackHours.slice(0, 10).sort((a, b) => a - b).join(', ')}... (+${fallbackHours.length - 10} more)`
                  : fallbackHours.sort((a, b) => a - b).join(', ')
                }
              </div>
            )}
            
            {isToday() && (
              <div className={`text-${color}-700 mt-2 p-2 bg-${color}-100 rounded`}>
                <strong>Note:</strong> Missing hours are expected for today's date as those market periods haven't occurred yet in your timezone.
              </div>
            )}
            
            {isFuture() && (
              <div className={`text-${color}-700 mt-2 p-2 bg-${color}-100 rounded`}>
                <strong>Note:</strong> Future dates show projected prices based on available day-ahead market data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataQualityIndicator;