import { motion } from 'framer-motion';
import { MapPin, Calendar, Compass, ArrowRight, Loader2 } from 'lucide-react';
import { useTripStore } from '@/store/use-trip-store';
import { usePlanTrip } from '@workspace/api-client-react';
import { LocationInput } from './LocationInput';

const PREFERENCES = [
  { id: 'scenic', label: 'Scenic Routes' },
  { id: 'fast', label: 'Fastest Path' },
  { id: 'food', label: 'Foodie Stops' },
  { id: 'nature', label: 'Nature & Parks' },
  { id: 'history', label: 'Historic Sites' }
];

export function Step2Route({ onNext }: { onNext: () => void }) {
  const { request, updateRequest, setPlan } = useTripStore();
  const planTrip = usePlanTrip();

  const handleTogglePref = (id: string) => {
    const prefs = request.preferences || [];
    if (prefs.includes(id)) {
      updateRequest({ preferences: prefs.filter(p => p !== id) });
    } else {
      updateRequest({ preferences: [...prefs, id] });
    }
  };

  const handleSubmit = () => {
    if (!request.startLocation || !request.destination) return;
    
    planTrip.mutate({
      data: {
        ...request,
        // API expects ISO 8601 string, but datetime-local might miss seconds/timezone
        startTime: new Date(request.startTime).toISOString()
      }
    }, {
      onSuccess: (res) => {
        setPlan(res);
        onNext();
      }
    });
  };

  const isValid = request.startLocation.length > 2 && request.destination.length > 2;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">Map your journey</h2>
        <p className="text-muted-foreground mt-2">Where are we heading and what are the vibes?</p>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6 relative overflow-hidden">
        <div className="absolute left-9 top-14 bottom-14 w-0.5 bg-border/80 border-dashed border-l-2 border-border/50" />
        
        <div className="relative z-10 space-y-2">
          <label className="text-sm font-semibold text-foreground ml-12 block">Starting Point</label>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 z-10 outline outline-4 outline-card">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <LocationInput
              value={request.startLocation}
              onChange={(val) => updateRequest({ startLocation: val })}
              placeholder="e.g. San Francisco, CA"
            />
          </div>
        </div>

        <div className="relative z-10 space-y-2">
          <label className="text-sm font-semibold text-foreground ml-12 block">Destination</label>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0 z-10 outline outline-4 outline-card">
              <MapPin className="w-4 h-4" />
            </div>
            <LocationInput
              value={request.destination}
              onChange={(val) => updateRequest({ destination: val })}
              placeholder="e.g. Yosemite National Park"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          When are you leaving?
        </label>
        <input 
          type="datetime-local"
          value={request.startTime}
          onChange={(e) => updateRequest({ startTime: e.target.value })}
          className="w-full sm:w-auto px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-foreground"
        />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          Trip Preferences
        </label>
        <div className="flex flex-wrap gap-3">
          {PREFERENCES.map(pref => {
            const isSelected = request.preferences?.includes(pref.id);
            return (
              <button
                key={pref.id}
                onClick={() => handleTogglePref(pref.id)}
                className={`
                  px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 border-2
                  ${isSelected 
                    ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                    : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50'}
                `}
              >
                {pref.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-6 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {planTrip.isPending ? "Generating your perfect adventure..." : "Ready to see the routes?"}
        </p>
        <button
          onClick={handleSubmit}
          disabled={!isValid || planTrip.isPending}
          className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {planTrip.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>Discover Routes <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </motion.div>
  );
}
