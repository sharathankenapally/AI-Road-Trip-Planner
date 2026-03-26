import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/Navbar';
import { StopsTimeline } from '@/components/dashboard/StopsTimeline';
import { MealsList } from '@/components/dashboard/MealsList';
import { DelayAdjuster } from '@/components/dashboard/DelayAdjuster';
import { useTripStore } from '@/store/use-trip-store';
import { Map, Flag, MapPin } from 'lucide-react';

export default function Dashboard() {
  const { plan, request } = useTripStore();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'stops' | 'meals'>('stops');

  useEffect(() => {
    if (!plan) {
      setLocation('/plan');
    }
  }, [plan, setLocation]);

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Summary */}
        <div className="bg-primary text-primary-foreground rounded-3xl p-8 sm:p-12 shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Map className="w-64 h-64" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
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
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shrink-0 min-w-[200px]">
              <div className="space-y-4">
                <div>
                  <div className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-1">Total Distance</div>
                  <div className="text-2xl font-bold">{plan.totalDistance}</div>
                </div>
                <div className="w-full h-px bg-white/20" />
                <div>
                  <div className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-1">Est. Arrival</div>
                  <div className="text-2xl font-bold">
                    {new Date(plan.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delay Adjuster */}
        <DelayAdjuster />

        {/* Tabs & Content */}
        <div>
          <div className="flex items-center gap-4 mb-8 border-b border-border/60 pb-px">
            <button
              onClick={() => setActiveTab('stops')}
              className={`pb-4 text-lg font-bold font-display border-b-2 transition-colors flex items-center gap-2 px-2
                ${activeTab === 'stops' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}
              `}
            >
              <Flag className="w-5 h-5" /> Route Stops ({plan.stops.length})
            </button>
            <button
              onClick={() => setActiveTab('meals')}
              className={`pb-4 text-lg font-bold font-display border-b-2 transition-colors flex items-center gap-2 px-2
                ${activeTab === 'meals' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}
              `}
            >
              <MapPin className="w-5 h-5" /> Dining ({plan.mealRecommendations.length})
            </button>
          </div>

          <div className="min-h-[50vh]">
            {activeTab === 'stops' ? <StopsTimeline /> : <MealsList />}
          </div>
        </div>
      </main>
    </div>
  );
}
