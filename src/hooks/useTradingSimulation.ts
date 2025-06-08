import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { tradingApi } from '../lib/api';
import type { Bid, SimulationResult } from '../types/trading';
import { generateBidId } from '../lib/utils';

export const useTradingSimulation = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<any>(null);
  const [selectedHour, setSelectedHour] = useState<number>(0);

  const simulationMutation = useMutation({
    mutationFn: ({ bids, date }: { bids: Bid[]; date: string }) =>
      tradingApi.simulateTrades(bids, date),
    onSuccess: (result) => {
      setSimulation(result);
      setError(null);
      toast.success('Simulation completed successfully!');
    },
    onError: (error) => {
      setError(error);
      setSimulation(null);
      
      // Extract error message for toast
      const errorResponse = (error as any)?.response;
      const status = errorResponse?.status;
      const message = errorResponse?.data?.error || 'Simulation failed. Please try again.';
      
      if (status === 429) {
        toast.error('API rate limit exceeded. Please wait before trying again.');
      } else {
        toast.error(message);
      }
      
      console.error('Simulation error:', error);
    },
    retry: false, // Don't auto-retry to avoid hitting rate limits
  });

  const addBid = (bidData: Omit<Bid, 'id'>) => {
    const hourBids = bids.filter(bid => bid.hour === bidData.hour);
    if (hourBids.length >= 10) {
      toast.error('Maximum 10 bids per hour allowed');
      return;
    }

    const newBid: Bid = {
      id: generateBidId(),
      ...bidData,
    };

    setBids(prev => [...prev, newBid]);
    toast.success('Bid added successfully');
  };

  const updateBid = (id: string, updates: Partial<Bid>) => {
    setBids(prev => prev.map(bid => 
      bid.id === id ? { ...bid, ...updates } : bid
    ));
  };

  const removeBid = (id: string) => {
    setBids(prev => prev.filter(bid => bid.id !== id));
    toast.success('Bid removed');
  };

  const runSimulation = (date: string) => {
    if (bids.length === 0) {
      toast.error('Please add at least one bid to simulate');
      return;
    }

    if (!date) {
      toast.error('Please select a date for simulation');
      return;
    }

    // Check if already simulating to prevent multiple simultaneous requests
    if (simulationMutation.isPending) {
      toast.error('Simulation already in progress. Please wait.');
      return;
    }

    // Clear previous error when starting new simulation
    setError(null);
    simulationMutation.mutate({ bids, date });
  };

  return {
    bids,
    simulation,
    error,
    selectedHour,
    setSelectedHour,
    isSimulating: simulationMutation.isPending,
    addBid,
    updateBid,
    removeBid,
    runSimulation,
  };
};