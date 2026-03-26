import { useState } from 'react';
import { Clock, MapPin, RefreshCw } from 'lucide-react';
import { useTripStore } from '@/store/use-trip-store';
import { useAdjustTrip } from '@workspace/api-client-react';

export function DelayAdjuster() {
  const { request, setPlan } = useTripStore();
  const adjustTrip = useAdjustTrip();
  
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [currentLocation, setCurrentLocation] = useState('');

  const handleAdjust = () => {
    adjustTrip.mutate({
      data: {
        originalRequest: request,
        delayMinutes,
        currentLocation: currentLocation || undefined
      }
    }, {
      onSuccess: (res) => {
        setPlan(res);
      }
    });
  };

  return (
    <div className="bg-gradient-to-br from-card to-muted/30 border border-border/80 rounded-2xl p-6 sm:p-8 shadow-lg shadow-black/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div className="flex-1">
          <h3 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Running Behind?
          </h3>
          <p className="text-muted-foreground mt-2">
            We'll adjust your stops and find open restaurants based on your new arrival times.
          </p>
        </div>

        <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Delay Time</label>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="15" 
                max="180" 
                step="15"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(parseInt(e.target.value))}
                className="w-full accent-primary h-2 bg-border rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-bold text-lg min-w-[4rem] text-right">{delayMinutes}m</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Current Location (Optional)</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="Where are you now?"
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleAdjust}
          disabled={adjustTrip.isPending}
          className="w-full md:w-auto px-6 py-4 bg-foreground text-background font-bold rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-70 disabled:pointer-events-none"
        >
          {adjustTrip.isPending ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <><RefreshCw className="w-5 h-5" /> Adjust Plan</>
          )}
        </button>
      </div>
    </div>
  );
}
