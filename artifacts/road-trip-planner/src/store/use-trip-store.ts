import { create } from 'zustand';
import type { TripPlanRequest, TripPlanResponse, MusicPlaylistResponse, Stop } from '@workspace/api-client-react';

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
}

interface TripState {
  // Wizard Input State
  request: TripPlanRequest;
  
  // App Data State
  plan: TripPlanResponse | null;
  previousPlan: TripPlanResponse | null;
  
  // New State Features
  savedTripId: number | null;
  liveMode: boolean;
  currentPosition: { lat: number; lng: number } | null;
  notifications: Notification[];
  musicPlaylist: MusicPlaylistResponse | null;
  selectedRouteId: string | null;
  customStops: Stop[];
  
  // Actions
  updateRequest: (updates: Partial<TripPlanRequest>) => void;
  setPlan: (plan: TripPlanResponse) => void;
  reset: () => void;
  setLiveMode: (liveMode: boolean) => void;
  setCurrentPosition: (pos: { lat: number; lng: number } | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markNotificationsRead: () => void;
  setMusicPlaylist: (playlist: MusicPlaylistResponse | null) => void;
  setSavedTripId: (id: number | null) => void;
  addCustomStop: (stop: Stop) => void;
  removeCustomStop: (stopId: string) => void;
  reorderStops: (newStops: Stop[]) => void;
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
  
  savedTripId: null,
  liveMode: false,
  currentPosition: null,
  notifications: [],
  musicPlaylist: null,
  selectedRouteId: null,
  customStops: [],
  
  updateRequest: (updates) => 
    set((state) => ({ 
      request: { ...state.request, ...updates } 
    })),
    
  setPlan: (plan) => 
    set((state) => ({ 
      previousPlan: state.plan, 
      plan,
      // Reset custom stops when a new plan is fully generated, but you might want to preserve them depending on UX.
      // Let's reset them if it's a completely new plan
    })),
    
  reset: () => 
    set({ 
      request: { ...defaultRequest }, 
      plan: null, 
      previousPlan: null,
      savedTripId: null,
      liveMode: false,
      currentPosition: null,
      notifications: [],
      musicPlaylist: null,
      selectedRouteId: null,
      customStops: [],
    }),
    
  setLiveMode: (liveMode) => set({ liveMode }),
  
  setCurrentPosition: (currentPosition) => set({ currentPosition }),
  
  addNotification: (notification) => 
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: Math.random().toString(36).substring(7),
          read: false
        },
        ...state.notifications
      ]
    })),
    
  markNotificationsRead: () => 
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    })),
    
  setMusicPlaylist: (musicPlaylist) => set({ musicPlaylist }),
  
  setSavedTripId: (savedTripId) => set({ savedTripId }),
  
  addCustomStop: (stop) => 
    set((state) => ({
      customStops: [...state.customStops, { ...stop, isCustom: true }],
      plan: state.plan ? {
        ...state.plan,
        stops: [...state.plan.stops, { ...stop, isCustom: true }]
      } : null
    })),
    
  removeCustomStop: (stopId) => 
    set((state) => ({
      customStops: state.customStops.filter(s => s.id !== stopId),
      plan: state.plan ? {
        ...state.plan,
        stops: state.plan.stops.filter(s => s.id !== stopId)
      } : null
    })),
    
  reorderStops: (newStops) => 
    set((state) => ({
      plan: state.plan ? {
        ...state.plan,
        stops: newStops
      } : null
    })),
}));
