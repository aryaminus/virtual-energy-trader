import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import DateSelector from '../components/common/DateSelector';
import BidPlacementForm from '../components/trading/BidPlacementForm';
import BidSummary from '../components/trading/BidSummary';
import SimulationResults from '../components/trading/SimulationResults';
import TradingDeadlineNotice from '../components/trading/TradingDeadlineNotice';
import MarketPriceDisplay from '../components/trading/MarketPriceDisplay';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useTradingSimulation } from '../hooks/useTradingSimulation';

const Trading: React.FC = () => {
  const { selectedDate, setSelectedDate } = useAppContext();
  const {
    bids,
    simulation,
    isSimulating,
    error,
    selectedHour,
    setSelectedHour,
    addBid,
    updateBid,
    removeBid,
    runSimulation,
  } = useTradingSimulation();

  // Extract error details for better error handling
  const getErrorDetails = () => {
    if (!error) return null;
    
    const errorResponse = (error as any)?.response;
    const status = errorResponse?.status;
    const message = errorResponse?.data?.error || error.message || 'Trading simulation failed';
    
    return { status, message };
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Energy Trading Simulator</h2>
            <p className="text-gray-600">
              Place bids and simulate trading outcomes using real historical CAISO market data
            </p>
          </div>
          
          <DateSelector
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            label="Trading Date"
          />
        </div>
      </div>

      {/* Trading Deadline Notice */}
      <TradingDeadlineNotice selectedDate={selectedDate} />

      {/* Error State */}
      {error && errorDetails && (
        <ErrorMessage
          title={errorDetails.status === 503 ? "GridStatus API Not Configured" : "Simulation Failed"}
          message={errorDetails.message}
          errorCode={errorDetails.status}
          onRetry={() => runSimulation(selectedDate)}
        />
      )}

      {/* Simulation Results */}
      {simulation && !error && (
        <SimulationResults simulation={simulation} />
      )}

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-2 gap-6">
        <div className="space-y-6">
          <MarketPriceDisplay 
            selectedDate={selectedDate} 
            selectedHour={selectedHour} 
          />
          <BidPlacementForm
            selectedHour={selectedHour}
            onHourChange={setSelectedHour}
            bids={bids}
            onAddBid={addBid}
            onUpdateBid={updateBid}
            onRemoveBid={removeBid}
          />
        </div>
        
        <BidSummary
          bids={bids}
          onRunSimulation={() => runSimulation(selectedDate)}
          isSimulating={isSimulating}
        />
      </div>
    </div>
  );
};

export default Trading;