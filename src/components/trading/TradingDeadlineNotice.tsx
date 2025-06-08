import React from 'react';
import { Clock, AlertTriangle, Info, Globe } from 'lucide-react';

interface TradingDeadlineNoticeProps {
  selectedDate: string;
}

const TradingDeadlineNotice: React.FC<TradingDeadlineNoticeProps> = ({ selectedDate }) => {
  const getDeadlineStatus = () => {
    if (!selectedDate) return null;
    
    // Use local timezone for all calculations (client-side)
    const now = new Date();
    const selectedDateObj = new Date(selectedDate + 'T00:00:00'); // Treat as local date
    
    // Create deadline at 11:00 AM in local timezone
    const deadline = new Date(selectedDateObj);
    deadline.setHours(11, 0, 0, 0); // 11:00 AM local time
    
    const isToday = selectedDateObj.toDateString() === now.toDateString();
    const isFuture = selectedDateObj > now;
    const isPastDeadline = now > deadline;
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    const hoursUntilDeadline = Math.floor(timeUntilDeadline / (1000 * 60 * 60));
    const minutesUntilDeadline = Math.floor((timeUntilDeadline % (1000 * 60 * 60)) / (1000 * 60));
    
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return {
      isToday,
      isFuture,
      isPastDeadline,
      hoursUntilDeadline,
      minutesUntilDeadline,
      timeUntilDeadline,
      userTimezone,
      deadlineTime: deadline.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const deadlineStatus = getDeadlineStatus();
  
  if (!deadlineStatus) return null;

  // Future date
  if (deadlineStatus.isFuture) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-yellow-600" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-900">Future Trading Date</h4>
            <p className="text-sm text-yellow-700">
              Trading for {selectedDate} - Market opens at {deadlineStatus.deadlineTime} on {selectedDate}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-yellow-600">
            <Globe className="w-3 h-3" />
            {deadlineStatus.userTimezone}
          </div>
        </div>
      </div>
    );
  }

  // Today - check if before or after deadline
  if (deadlineStatus.isToday) {
    if (deadlineStatus.isPastDeadline) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Trading Deadline Passed</h4>
              <p className="text-sm text-red-700">
                Day-ahead market bidding closed at {deadlineStatus.deadlineTime}. Bids placed now are for simulation only.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-red-600">
              <Globe className="w-3 h-3" />
              {deadlineStatus.userTimezone}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900">Day-Ahead Market Open</h4>
              <p className="text-sm text-green-700">
                Deadline: {deadlineStatus.deadlineTime} ({deadlineStatus.hoursUntilDeadline}h {deadlineStatus.minutesUntilDeadline}m remaining)
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Globe className="w-3 h-3" />
              {deadlineStatus.userTimezone}
            </div>
          </div>
        </div>
      );
    }
  }

  // Past date (historical simulation)
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900">Historical Market Simulation</h4>
          <p className="text-sm text-blue-700">
            Trading for {selectedDate} - Deadline was {deadlineStatus.deadlineTime} on {selectedDate}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <Globe className="w-3 h-3" />
          {deadlineStatus.userTimezone}
        </div>
      </div>
    </div>
  );
};

export default TradingDeadlineNotice;