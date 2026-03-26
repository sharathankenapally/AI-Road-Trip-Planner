import { create } from 'zustand';
import type { TripPlanRequest, TripPlanResponse } from '@workspace/api-client-react';

interface TripState {
  // Wizard Input State
  request: TripPlanRequest;
  
  // App Data State
  plan: TripPlanResponse | null;
  previousPlan: TripPlanResponse | null;
  
  // Actions
  updateRequest: (updates: Partial<TripPlanRequest>) => void;
  setPlan: (plan: TripPlanResponse) => void;
  reset: () => void;
}

const defaultRequest: TripPlanRequest = {
  travelers: 2,
  vehicleType: 'suv',
  startLocation: '',
  destination: '',
  startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // Tomorrow
  preferences: [],
};

export const useTripStore = create<TripState>((set) => ({
  request: { ...defaultRequest },
  plan: null,
  previousPlan: null,
  
  updateRequest: (updates) => 
    set((state) => ({ 
      request: { ...state.request, ...updates } 
    })),
    
  setPlan: (plan) => 
    set((state) => ({ 
      previousPlan: state.plan, 
      plan 
    })),
    
  reset: () => 
    set({ 
      request: { ...defaultRequest }, 
      plan: null, 
      previousPlan: null 
    }),
}));
