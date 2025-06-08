import React from 'react';
import { Info, TrendingUp, AlertCircle } from 'lucide-react';
import { calculateMarketStats } from '../../lib/marketUtils';
import type { MarketData } from '../../types/market';

interface MarketInsightsProps {
  marketData: MarketData;
}

const MarketInsights: React.FC<MarketInsightsProps> = ({ marketData }) => {
  const stats = calculateMarketStats(marketData.dayAheadPrices, marketData.realTimePrices);
  const spreadRange = Math.abs(stats.maxSpread - stats.minSpread);

  const getVolatilityLevel = (volatility: number) => {
    if (volatility > 20) return { level: 'High', color: 'text-red-600', icon: AlertCircle };
    if (volatility > 10) return { level: 'Moderate', color: 'text-yellow-600', icon: TrendingUp };
    return { level: 'Low', color: 'text-green-600', icon: Info };
  };

  const volatilityInfo = getVolatilityLevel(stats.volatility);
  const VolatilityIcon = volatilityInfo.icon;

  const getArbitrageOpportunity = () => {
    if (Math.abs(stats.maxSpread) > 15) {
      return {
        level: 'High',
        description: 'Significant price differentials present strong arbitrage opportunities for experienced traders.',
        color: 'text-green-600'
      };
    } else if (Math.abs(stats.maxSpread) > 5) {
      return {
        level: 'Moderate',
        description: 'Moderate price differences suggest some arbitrage potential with careful timing.',
        color: 'text-yellow-600'
      };
    } else {
      return {
        level: 'Limited',
        description: 'Small price differences indicate stable market conditions with limited arbitrage potential.',
        color: 'text-gray-600'
      };
    }
  };

  const arbitrageInfo = getArbitrageOpportunity();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Info className="w-5 h-5 text-blue-600" />
        Market Insights & Analysis
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Volatility Analysis */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <VolatilityIcon className={`w-5 h-5 ${volatilityInfo.color}`} />
            <h4 className="font-semibold text-gray-800">Price Volatility</h4>
            <span className={`text-sm font-medium ${volatilityInfo.color}`}>
              {volatilityInfo.level}
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm text-gray-600">Volatility Index</div>
                <div className={`text-lg font-bold ${volatilityInfo.color}`}>
                  {stats.volatility.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Spread Range</div>
                <div className="text-lg font-bold text-gray-900">
                  ${spreadRange.toFixed(2)}
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm">
              Real-time prices show {spreadRange.toFixed(2)} $/MWh range compared to day-ahead prices, 
              indicating {volatilityInfo.level.toLowerCase()} market volatility with a volatility index of {stats.volatility.toFixed(2)}.
            </p>
          </div>
        </div>

        {/* Trading Opportunities */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${arbitrageInfo.color}`} />
            <h4 className="font-semibold text-gray-800">Trading Opportunities</h4>
            <span className={`text-sm font-medium ${arbitrageInfo.color}`}>
              {arbitrageInfo.level}
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm text-gray-600">Max Spread</div>
                <div className={`text-lg font-bold ${stats.maxSpread >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${stats.maxSpread.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Min Spread</div>
                <div className={`text-lg font-bold ${stats.minSpread >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${stats.minSpread.toFixed(2)}
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm">
              {arbitrageInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* Market Conditions Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h5 className="font-medium text-blue-900 mb-2">Market Conditions Summary</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Average DA Price:</span>
            <span className="ml-2 text-blue-900">${stats.avgDayAhead.toFixed(2)}/MWh</span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Average RT Price:</span>
            <span className="ml-2 text-blue-900">${stats.avgRealTime.toFixed(2)}/MWh</span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Price Premium:</span>
            <span className={`ml-2 font-medium ${(stats.avgRealTime - stats.avgDayAhead) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(stats.avgRealTime - stats.avgDayAhead).toFixed(2)}/MWh
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;