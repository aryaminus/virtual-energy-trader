import React from 'react';
import { Bid } from '../../types/trading';
import { cn } from '../../lib/utils';

interface BidSummaryProps {
  bids: Bid[];
  onRunSimulation: () => void;
  isLoading: boolean;
}

const BidSummary: React.FC<BidSummaryProps> = ({
  bids,
  onRunSimulation,
  isLoading,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">All Bids Summary</h3>
        <div className="text-sm text-gray-600">
          {bids.length} total bids
        </div>
      </div>

      {bids.length > 0 ? (
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {Array.from({ length: 24 }, (_, hour) => {
            const hourBids = bids.filter(bid => bid.hour === hour);
            if (hourBids.length === 0) return null;
            
            return (
              <div key={hour} className="border border-gray-200 rounded-lg p-3">
                <div className="font-medium text-sm text-gray-800 mb-2">
                  Hour {hour}:00 ({hourBids.length} bids)
                </div>
                <div className="space-y-1">
                  {hourBids.map(bid => (
                    <div key={bid.id} className="text-xs text-gray-600 flex justify-between">
                      <span className={cn(
                        "px-2 py-1 rounded text-white",
                        bid.type === 'buy' ? 'bg-green-600' : 'bg-red-600'
                      )}>
                        {bid.type.toUpperCase()}
                      </span>
                      <span>${bid.price} × {bid.quantity} MWh</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No bids placed yet</p>
      )}

      {/* Run Simulation Button */}
      <button
        onClick={onRunSimulation}
        disabled={isLoading || bids.length === 0}
        className={cn(
          "w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all",
          isLoading || bids.length === 0
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl"
        )}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V4a2 2 0 00-2-2H5a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V4z" />
          </svg>
        )}
        <span>{isLoading ? 'Running Simulation...' : 'Run Trading Simulation'}</span>
      </button>
    </div>
  );
};

export default BidSummary;