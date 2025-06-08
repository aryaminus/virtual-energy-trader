import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';
import { SimulationResult } from '../../types/trading';
import { cn } from '../../lib/utils';
import StatCard from '../ui/StatCard';

interface SimulationResultsProps {
  simulation: SimulationResult | null;
}

const SimulationResults: React.FC<SimulationResultsProps> = ({ simulation }) => {
  if (!simulation) return null;

  const executedTrades = simulation.trades.filter(trade => trade.executed);
  const totalExecuted = executedTrades.length;
  const successRate = simulation.trades.length > 0 ? (totalExecuted / simulation.trades.length * 100) : 0;

  const prepareHourlyProfitChart = () => {
    const hourlyData: { [hour: number]: number } = {};
    
    // Initialize all hours with 0 profit
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = 0;
    }
    
    // Sum profits by hour
    simulation.trades.forEach(trade => {
      if (trade.executed) {
        hourlyData[trade.hour] += trade.profit;
      }
    });
    
    return Object.entries(hourlyData).map(([hour, profit]) => ({
      hour: parseInt(hour),
      profit: Math.round(profit * 100) / 100,
      profitColor: profit >= 0 ? '#059669' : '#DC2626'
    }));
  };

  const hourlyProfitData = prepareHourlyProfitChart();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Profit/Loss"
          value={`$${simulation.totalProfit.toFixed(2)}`}
          icon={DollarSign}
          color={simulation.totalProfit >= 0 ? 'green' : 'red'}
        />
        
        <StatCard
          title="Executed Trades"
          value={totalExecuted.toString()}
          subtitle={`of ${simulation.trades.length} bids`}
          icon={TrendingUp}
          color="blue"
        />
        
        <StatCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon={() => (
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              %
            </div>
          )}
          color="purple"
        />
        
        <StatCard
          title="Avg Profit/Trade"
          value={`$${totalExecuted > 0 ? (simulation.totalProfit / totalExecuted).toFixed(2) : '0.00'}`}
          icon={DollarSign}
          color={totalExecuted > 0 ? (simulation.totalProfit / totalExecuted >= 0 ? 'green' : 'red') : 'gray'}
        />
      </div>

      {/* Hourly Profit Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Hourly Trading Results</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyProfitData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Profit']}
              labelFormatter={(hour: number) => `Hour ${hour}:00`}
            />
            <Bar 
              dataKey="profit" 
              fill="#8884d8"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Results Table */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Detailed Trading Results</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bid Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Execution Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RT Avg Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit/Loss
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {simulation.trades.map((trade) => (
                <tr key={trade.id} className={trade.executed ? 'bg-green-50' : 'bg-red-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {trade.hour}:00
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      trade.type === 'buy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    )}>
                      {trade.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${trade.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trade.quantity} MWh
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      trade.executed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    )}>
                      {trade.executed ? 'EXECUTED' : 'NOT EXECUTED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trade.executed ? `$${trade.executionPrice?.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trade.executed ? `$${trade.avgRealTimePrice?.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={cn(
                      trade.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {trade.executed ? `$${trade.profit.toFixed(2)}` : '$0.00'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SimulationResults;