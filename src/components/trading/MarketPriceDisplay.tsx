import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useMarketData } from '../../hooks/useMarketData';

interface MarketPriceDisplayProps {
  selectedDate: string;
  selectedHour: number;
}

const MarketPriceDisplay: React.FC<MarketPriceDisplayProps> = ({ selectedDate, selectedHour }) => {
  const { data: marketData, isLoading } = useMarketData(selectedDate);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Market Prices - Hour {selectedHour}</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Market Prices - Hour {selectedHour}</h3>
        <p className="text-gray-500">No market data available for {selectedDate}</p>
      </div>
    );
  }

  const dayAheadPrice = marketData.dayAheadPrices.find(p => p.hour === selectedHour);
  const realTimeData = marketData.realTimePrices.find(p => p.hour === selectedHour);
  const avgRealTimePrice = realTimeData 
    ? realTimeData.prices.reduce((sum, p) => sum + p.price, 0) / realTimeData.prices.length
    : 0;

  const spread = avgRealTimePrice - (dayAheadPrice?.price || 0);
  const spreadPercentage = dayAheadPrice?.price ? (spread / dayAheadPrice.price) * 100 : 0;

  const getDataQualityIcon = (quality?: string) => {
    switch (quality) {
      case 'actual': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'interpolated': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'fallback': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getDataQualityText = (quality?: string) => {
    switch (quality) {
      case 'actual': return 'Real market data';
      case 'interpolated': return 'Interpolated price';
      case 'fallback': return 'Fallback/projected price';
      default: return '';
    }
  };
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-600" />
        Market Prices - Hour {selectedHour}:00
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium flex items-center gap-1">
            Day-Ahead Price
            {getDataQualityIcon(dayAheadPrice?.dataQuality)}
          </div>
          <div className="text-2xl font-bold text-blue-900">
            ${dayAheadPrice?.price.toFixed(2) || 'N/A'}
          </div>
          <div className="text-xs text-blue-600">
            per MWh
            {dayAheadPrice?.dataQuality && (
              <div className="mt-1 text-xs text-gray-600">
                {getDataQualityText(dayAheadPrice.dataQuality)}
                {dayAheadPrice.recordCount !== undefined && dayAheadPrice.recordCount > 0 && (
                  <span> ({dayAheadPrice.recordCount} records)</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium flex items-center gap-1">
            Real-Time Avg
            {getDataQualityIcon(realTimeData?.dataQuality)}
          </div>
          <div className="text-2xl font-bold text-green-900">
            ${avgRealTimePrice.toFixed(2)}
          </div>
          <div className="text-xs text-green-600">
            per MWh
            {realTimeData?.dataQuality && (
              <div className="mt-1 text-xs text-gray-600">
                {getDataQualityText(realTimeData.dataQuality)}
                {realTimeData.recordCount !== undefined && realTimeData.recordCount > 0 && (
                  <span> ({realTimeData.recordCount} records)</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className={`rounded-lg p-4 ${spread >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`text-sm font-medium flex items-center gap-1 ${spread >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {spread >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            RT Premium
          </div>
          <div className={`text-2xl font-bold ${spread >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            ${spread.toFixed(2)}
          </div>
          <div className={`text-xs ${spread >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {spreadPercentage >= 0 ? '+' : ''}{spreadPercentage.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {realTimeData && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Real-Time Price Intervals</h4>
          <div className="grid grid-cols-4 gap-2">
            {realTimeData.prices.map((price, index) => (
              <div key={index} className={`text-center p-2 rounded ${
                price.dataQuality === 'actual' ? 'bg-green-50' : 
                price.dataQuality === 'fallback' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div className="text-xs text-gray-600">:{(index * 15).toString().padStart(2, '0')}</div>
                <div className="text-sm font-medium">${price.price.toFixed(2)}</div>
                {price.dataQuality !== 'actual' && (
                  <div className="text-xs text-gray-500">
                    {price.dataQuality === 'fallback' ? 'proj.' : 'est.'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPriceDisplay;