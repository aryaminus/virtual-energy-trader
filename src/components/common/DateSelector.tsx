import React from 'react';
import { Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface DateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  label?: string;
  className?: string;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateSelect,
  label = "Select Date",
  className = "",
}) => {
  // Use local timezone for max date calculation (client-side)
  const maxDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Format the selected date for display in local timezone
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + 'T00:00:00'); // Treat as local date
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        <label className="text-sm font-medium text-gray-700">{label}:</label>
      </div>
      
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateSelect(e.target.value)}
        max={maxDate}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
      
      {selectedDate && (
        <div className="text-xs text-gray-500">
          Selected: {formatDateForDisplay(selectedDate)}
        </div>
      )}
    </div>
  );
};

export default DateSelector;