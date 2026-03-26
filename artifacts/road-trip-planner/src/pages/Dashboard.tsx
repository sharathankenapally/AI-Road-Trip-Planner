import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/Navbar';
import { StopsTimeline } from '@/components/dashboard/StopsTimeline';
import { MealsList } from '@/components/dashboard/MealsList';
import { DelayAdjuster } from '@/components/dashboard/DelayAdjuster';
import { useTripStore } from '@/store/use-trip-store';
import { Map, Flag, MapPin, Save, PlayCircle, Navigation, Music as MusicIcon } from 'lucide-react';
import { formatTripTime } from '@/utils/formatTripTime';
import { useSaveTrip } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

import { MapView } from '@/components/dashboard/MapView';
import { LiveTripMode } from '@/components/dashboard/LiveTripMode';
import { TrafficPanel } from '@/components/dashboard/TrafficPanel';
import { NearbyPlaces } from '@/components/dashboard/NearbyPlaces';
import { MusicPlayer } from '@/components/dashboard/MusicPlayer';
import { AiAdvisor } from '@/components/dashboard/AiAdvisor';

export default function Dashboard() {
  const { plan, request, liveMode, setLiveMode, savedTripId, setSavedTripId } = useTripStore();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'stops' | 'meals' | 'map' | 'music' | 'nearby'>('map');
  const saveTripMutation = useSaveTrip();

  useEffect(() => {
    if (!plan) {
      setLocation('/plan');
    }
  }, [plan, setLocation]);

  if (!plan) return null;

  const handleSaveTrip = () => {
    saveTripMutation.mutate({
      data: {
        name: `${request.startLocation} to ${request.destination}`,
        travelers: request.travelers,
        vehicleType: request.vehicleType,
        startLocation: request.startLocation,
        destination: request.destination,
        startTime: request.startTime,
        plan: plan,
      }
    }, {
      onSuccess: (res) => {
        setSavedTripId(res.id);
        toast({ title: "Trip saved successfully!" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <Navbar />
      <LiveTripMode />
      <AiAdvisor />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Summary */}
        <div className="bg-primary text-primary-foreground rounded-3xl p-8 sm:p-12 shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Map className="w-64 h-64" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div>
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-bold uppercase tracking-wider mb-4 inline-block">
                Trip Itinerary
              </span>
              <h1 className="text-4xl sm:text-5xl font-display font-bold leading-tight">
                {request.startLocation} <br/> 
                <span className="text-white/60">to</span> {request.destination}
              </h1>
              <p className="mt-4 text-lg text-white/90 max-w-xl leading-relaxed">
                {plan.summary}
              </p>
              
              <div className="flex gap-4 mt-6">
                {!liveMode && (
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="hover-elevate font-bold shadow-lg"
                    onClick={() => setLiveMode(true)}
                  >
                    <PlayCircle className="w-5 h-5 mr-2" /> Start Live Trip
                  </Button>
                )}
                {!savedTripId && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/20 hover:text-primary-foreground hover-elevate font-bold"
                    onClick={handleSaveTrip}
                    disabled={saveTripMutation.isPending}
                  >
                    <Save className="w-5 h-5 mr-2" /> Save Trip
                  </Button>
                )}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shrink-0 min-w-[250px] w-full lg:w-auto">
              <div className="space-y-4">
                <div>
                  <div className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-1">Total Distance</div>
                  <div className="text-2xl font-bold">{plan.totalDistance}</div>
                </div>
                <div className="w-full h-px bg-white/20" />
                <div>
                  <div className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-1">Est. Arrival</div>
                  <div className="text-2xl font-bold">
                    {formatTripTime(plan.estimatedArrival)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <DelayAdjuster />
            
            {/* Main Tabs */}
            <div>
              <div className="flex overflow-x-auto no-scrollbar items-center gap-2 sm:gap-6 mb-8 border-b border-border/60 pb-px">
                {[
                  { id: 'map', label: 'Map View', icon: <Map className="w-5 h-5" /> },
                  { id: 'stops', label: `Stops (${plan.stops.length})`, icon: <Flag className="w-5 h-5" /> },
                  { id: 'meals', label: `Dining (${plan.mealRecommendations.length})`, icon: <MapPin className="w-5 h-5" /> },
                  { id: 'nearby', label: 'Nearby Places', icon: <Navigation className="w-5 h-5" /> },
                  { id: 'music', label: 'Music', icon: <MusicIcon className="w-5 h-5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-4 text-base sm:text-lg font-bold font-display border-b-2 transition-colors flex items-center gap-2 px-2 whitespace-nowrap
                      ${activeTab === tab.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}
                    `}
                  >
                    {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="min-h-[50vh]">
                {activeTab === 'map' && <MapView />}
                {activeTab === 'stops' && <StopsTimeline />}
                {activeTab === 'meals' && <MealsList />}
                {activeTab === 'nearby' && <NearbyPlaces />}
                {activeTab === 'music' && <MusicPlayer />}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            <TrafficPanel />
            {activeTab !== 'music' && <MusicPlayer />}
          </div>
        </div>
      </main>
    </div>
  );
}

