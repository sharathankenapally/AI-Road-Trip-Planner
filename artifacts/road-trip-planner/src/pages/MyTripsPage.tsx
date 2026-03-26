import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useListTrips, useDeleteTrip, useUpdateTrip } from '@workspace/api-client-react';
import { useTripStore } from '@/store/use-trip-store';
import { useLocation } from 'wouter';
import { Map, Calendar, Users, Car, Trash2, Heart, Play, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { getListTripsQueryKey } from '@workspace/api-client-react';

export default function MyTripsPage() {
  const { data, isLoading, error } = useListTrips();
  const deleteTrip = useDeleteTrip();
  const updateTrip = useUpdateTrip();
  const { setPlan, setSavedTripId } = useTripStore();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLoad = (trip: any) => {
    if (trip.plan) {
      setPlan(trip.plan);
      setSavedTripId(trip.id);
      setLocation('/dashboard');
    }
  };

  const handleDelete = (id: number) => {
    deleteTrip.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
        }
      }
    );
  };

  const handleToggleFavorite = (id: number, currentStatus: boolean) => {
    updateTrip.mutate(
      { id, data: { isFavorite: !currentStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Map className="w-8 h-8 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-display font-bold">My Saved Trips</h1>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border/50 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-6 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <p className="font-medium">Failed to load saved trips.</p>
          </div>
        ) : !data?.trips || data.trips.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-3xl p-12 text-center shadow-sm">
            <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold font-display text-foreground mb-2">No trips saved yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Plan your next adventure and save it to access it anytime, anywhere.
            </p>
            <Button onClick={() => setLocation('/plan')} className="hover-elevate">
              Plan a New Trip
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.trips.map((trip) => (
              <div 
                key={trip.id} 
                className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative group"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold font-display leading-tight pr-8">{trip.name}</h3>
                    <button 
                      onClick={() => handleToggleFavorite(trip.id, trip.isFavorite)}
                      disabled={updateTrip.isPending}
                      className="absolute top-6 right-6 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${trip.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2 text-sm text-foreground/80">
                      <Map className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{trip.startLocation} &rarr; {trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>{format(parseISO(trip.startTime), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {trip.travelers}</span>
                      <span className="flex items-center gap-1 capitalize"><Car className="w-4 h-4" /> {trip.vehicleType.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 px-6 py-4 flex items-center justify-between border-t border-border/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(trip.id)}
                    disabled={deleteTrip.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  
                  <Button 
                    onClick={() => handleLoad(trip)}
                    disabled={!trip.plan}
                    className="hover-elevate"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Load
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
