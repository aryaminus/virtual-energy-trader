import React from 'react';
import { DollarSign, Activity, TrendingUp } from 'lucide-react';
import StatCard from '../ui/StatCard';
import { calculateMarketStats } from '../../lib/marketUtils';
import type { MarketData } from '../../types/market';

interface MarketStatsGridProps {
  marketData: MarketData;
}

const MarketStatsGrid: React.FC<MarketStatsGridProps> = ({ marketData }) => {
  const stats = calculateMarketStats(marketData.dayAheadPrices, marketData.realTimePrices);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Avg Day-Ahead"
        value={`$${stats.avgDayAhead.toFixed(2)}`}
        subtitle="per MWh"
        icon={DollarSign}
        iconColor="text-blue-600"
        valueColor="text-blue-600"
      />
      
      <StatCard
        title="Avg Real-Time"
        value={`$${stats.avgRealTime.toFixed(2)}`}
        subtitle="per MWh"
        icon={Activity}
        iconColor="text-green-600"
        valueColor="text-green-600"
      />
      
      <StatCard
        title="Max Spread"
        value={`$${stats.maxSpread.toFixed(2)}`}
        subtitle="RT - DA"
        icon={TrendingUp}
        iconColor="text-green-600"
        valueColor={stats.maxSpread >= 0 ? 'text-green-600' : 'text-red-600'}
      />
      
      <StatCard
        title="Min Spread"
        value={`$${stats.minSpread.toFixed(2)}`}
        subtitle="RT - DA"
        icon={TrendingUp}
        iconColor="text-red-600"
        valueColor={stats.minSpread >= 0 ? 'text-green-600' : 'text-red-600'}
      />
    </div>
  );
};

export default MarketStatsGrid;