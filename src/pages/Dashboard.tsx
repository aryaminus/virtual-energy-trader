import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import DateSelector from '../components/common/DateSelector';
import MarketDataChart from '../components/dashboard/MarketDataChart';
import MarketStatsGrid from '../components/dashboard/MarketStatsGrid';
import MarketInsights from '../components/dashboard/MarketInsights';
import DataQualityIndicator from '../components/dashboard/DataQualityIndicator';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useMarketData } from '../hooks/useMarketData';

const Dashboard: React.FC = () => {
  const { selectedDate, setSelectedDate } = useAppContext();
  const { data: marketData, isLoading, error, refetch } = useMarketData(selectedDate);

  // Extract error details for better error handling
  const getErrorDetails = () => {
    if (!error) return null;
    
    const errorResponse = (error as any)?.response;
    const status = errorResponse?.status;
    const message = errorResponse?.data?.error || error.message || 'An unexpected error occurred';
    
    return { status, message };
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Market Data Dashboard</h2>
            <p className="text-gray-600">
              Real historical CAISO energy market prices from GridStatus API
            </p>
          </div>
          
          <DateSelector
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            label="Select Date"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && errorDetails && (
        <ErrorMessage
          title={errorDetails.status === 503 ? "Backend Not Deployed" : undefined}
          message={errorDetails.message}
          errorCode={errorDetails.status}
          onRetry={() => refetch()}
        />
      )}

      {/* Market Data Content */}
      {marketData && !isLoading && !error && (
        <>
          <DataQualityIndicator marketData={marketData} selectedDate={selectedDate} />
          <MarketStatsGrid marketData={marketData} />
          <MarketDataChart marketData={marketData} />
          <MarketInsights marketData={marketData} />
        </>
      )}
    </div>
  );
};

export default Dashboard;