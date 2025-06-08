import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';

interface AppContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Initialize with yesterday's date
  useEffect(() => {
    if (!selectedDate) {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      setSelectedDate(yesterday);
    }
  }, [selectedDate]);

  const value = {
    selectedDate,
    setSelectedDate,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};