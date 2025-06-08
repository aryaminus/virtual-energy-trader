import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Bid } from '../../types/trading';

interface BidValidationHelperProps {
  bid: Omit<Bid, 'id'>;
  marketPrice?: number;
}

const BidValidationHelper: React.FC<BidValidationHelperProps> = ({ bid, marketPrice }) => {
  const getValidationMessages = () => {
    const messages: Array<{ type: 'error' | 'warning' | 'info' | 'success'; message: string }> = [];

    // Price validation
    if (bid.price <= 0) {
      messages.push({ type: 'error', message: 'Price must be greater than $0/MWh' });
    } else if (bid.price > 1000) {
      messages.push({ type: 'warning', message: 'Price above $1000/MWh is unusually high' });
    } else if (bid.price < 10) {
      messages.push({ type: 'warning', message: 'Price below $10/MWh is unusually low' });
    }

    // Quantity validation
    if (bid.quantity <= 0) {
      messages.push({ type: 'error', message: 'Quantity must be greater than 0 MWh' });
    } else if (bid.quantity > 100) {
      messages.push({ type: 'warning', message: 'Large quantity (>100 MWh) - ensure this is intended' });
    }

    // Market price comparison
    if (marketPrice && bid.price && bid.quantity > 0) {
      const priceDiff = Math.abs(bid.price - marketPrice);
      const priceDiffPercent = (priceDiff / marketPrice) * 100;

      if (bid.type === 'buy') {
        if (bid.price >= marketPrice) {
          messages.push({ 
            type: 'success', 
            message: `Buy bid likely to execute (${(bid.price - marketPrice).toFixed(2)} above market)` 
          });
        } else {
          messages.push({ 
            type: 'info', 
            message: `Buy bid ${(marketPrice - bid.price).toFixed(2)} below market price` 
          });
        }
      } else {
        if (bid.price <= marketPrice) {
          messages.push({ 
            type: 'success', 
            message: `Sell bid likely to execute (${(marketPrice - bid.price).toFixed(2)} below market)` 
          });
        } else {
          messages.push({ 
            type: 'info', 
            message: `Sell bid ${(bid.price - marketPrice).toFixed(2)} above market price` 
          });
        }
      }

      if (priceDiffPercent > 50) {
        messages.push({ 
          type: 'warning', 
          message: `Bid price differs significantly from market (${priceDiffPercent.toFixed(0)}%)` 
        });
      }
    }

    // Strategy suggestions
    if (bid.type === 'buy' && bid.price && bid.quantity > 0) {
      messages.push({ 
        type: 'info', 
        message: `Strategy: Buy ${bid.quantity} MWh at $${bid.price} - profit if RT > DA` 
      });
    } else if (bid.type === 'sell' && bid.price && bid.quantity > 0) {
      messages.push({ 
        type: 'info', 
        message: `Strategy: Sell ${bid.quantity} MWh at $${bid.price} - profit if DA > RT` 
      });
    }

    return messages;
  };

  const messages = getValidationMessages();

  if (messages.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-700';
      case 'warning': return 'text-yellow-700';
      case 'success': return 'text-green-700';
      default: return 'text-blue-700';
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-2">
      {messages.map((msg, index) => (
        <div key={index} className={`flex items-start gap-2 p-2 rounded border ${getBgColor(msg.type)}`}>
          {getIcon(msg.type)}
          <span className={`text-xs ${getTextColor(msg.type)}`}>
            {msg.message}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BidValidationHelper;