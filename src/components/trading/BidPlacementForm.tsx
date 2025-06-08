import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Bid } from '../../types/trading';
import BidValidationHelper from './BidValidationHelper';
import { useMarketData } from '../../hooks/useMarketData';
import { useAppContext } from '../../contexts/AppContext';
import { cn } from '../../lib/utils';

interface BidPlacementFormProps {
  selectedHour: number;
  onHourChange: (hour: number) => void;
  bids: Bid[];
  onAddBid: (bid: Omit<Bid, 'id'>) => void;
  onUpdateBid: (id: string, updates: Partial<Bid>) => void;
  onRemoveBid: (id: string) => void;
}

const BidPlacementForm: React.FC<BidPlacementFormProps> = ({
  selectedHour,
  onHourChange,
  bids,
  onAddBid,
  onUpdateBid,
  onRemoveBid,
}) => {
  const { selectedDate } = useAppContext();
  const { data: marketData } = useMarketData(selectedDate);
  const [newBid, setNewBid] = useState({
    type: 'buy' as 'buy' | 'sell',
    price: 50,
    quantity: 1,
  });

  const hourBids = bids.filter(bid => bid.hour === selectedHour);
  const marketPrice = marketData?.dayAheadPrices.find(p => p.hour === selectedHour)?.price;

  const handleAddBid = () => {
    if (hourBids.length >= 10) {
      alert('Maximum 10 bids per hour allowed');
      return;
    }

    onAddBid({
      hour: selectedHour,
      ...newBid,
    });

    // Reset form
    setNewBid({
      type: 'buy',
      price: 50,
      quantity: 1,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Place Bids</h3>
      
      {/* Hour Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Hour
        </label>
        <select
          value={selectedHour}
          onChange={(e) => onHourChange(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              Hour {i}:00 - {i + 1}:00
            </option>
          ))}
        </select>
      </div>

      {/* New Bid Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">New Bid</h4>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Type
            </label>
            <select
              value={newBid.type}
              onChange={(e) => setNewBid(prev => ({ ...prev, type: e.target.value as 'buy' | 'sell' }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Price ($/MWh)
            </label>
            <input
              type="number"
              value={newBid.price}
              onChange={(e) => setNewBid(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              min="0"
              step="0.01"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Quantity (MWh)
            </label>
            <input
              type="number"
              value={newBid.quantity}
              onChange={(e) => setNewBid(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
              min="0.1"
              step="0.1"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Bid Validation Helper */}
        <BidValidationHelper 
          bid={{ ...newBid, hour: selectedHour }} 
          marketPrice={marketPrice}
        />
        
        <button
          onClick={handleAddBid}
          disabled={hourBids.length >= 10}
          className={cn(
            "w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all",
            hourBids.length >= 10
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
          )}
        >
          <Plus className="w-4 h-4" />
          <span>Add Bid for Hour {selectedHour} ({hourBids.length}/10)</span>
        </button>
      </div>

      {/* Hour Bids List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">
          Bids for Hour {selectedHour}
        </h4>
        {hourBids.map((bid, index) => (
          <div key={bid.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Bid #{index + 1}</span>
              <button
                onClick={() => onRemoveBid(bid.id)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={bid.type}
                  onChange={(e) => onUpdateBid(bid.id, { type: e.target.value as 'buy' | 'sell' })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price ($/MWh)</label>
                <input
                  type="number"
                  value={bid.price}
                  onChange={(e) => onUpdateBid(bid.id, { price: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity (MWh)</label>
                <input
                  type="number"
                  value={bid.quantity}
                  onChange={(e) => onUpdateBid(bid.id, { quantity: parseFloat(e.target.value) || 0 })}
                  min="0.1"
                  step="0.1"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
        
        {hourBids.length === 0 && (
          <p className="text-gray-500 text-center py-4">No bids for hour {selectedHour}</p>
        )}
      </div>
    </div>
  );
};

export default BidPlacementForm;