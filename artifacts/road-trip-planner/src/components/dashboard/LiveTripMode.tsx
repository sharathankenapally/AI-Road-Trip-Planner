import { useEffect, useState } from 'react';
import { useTripStore } from '@/store/use-trip-store';
import { Navigation, Flag, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { format, parseISO, differenceInMinutes } from 'date-fns';

export function LiveTripMode() {
  const { plan, liveMode, setLiveMode, setCurrentPosition, addNotification } = useTripStore();
  const [speed, setSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let watchId: number;
    let speedInterval: any;
    
    if (liveMode) {
      // Request notification permission
      if ('Notification' in window) {
        Notification.requestPermission();
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Simulate some progress based on time/movement
          setProgress(p => Math.min(100, p + 0.1));
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      // Simulate speed for UI
      speedInterval = setInterval(() => {
        setSpeed(Math.floor(55 + Math.random() * 15));
      }, 3000);
      
      // Simulate notifications
      setTimeout(() => {
        if (plan?.stops.length) {
          addNotification({
            message: `Approaching ${plan.stops[0].name} in 5 miles!`,
            time: format(new Date(), 'h:mm a')
          });
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Road Trip Update', { body: `Approaching ${plan.stops[0].name} in 5 miles!` });
          }
        }
      }, 10000);
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (speedInterval) clearInterval(speedInterval);
    };
  }, [liveMode, plan]);

  if (!plan || !liveMode) return null;

  const nextStop = plan.stops[0]; // Simplified for now

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4"
      >
        <div className="bg-foreground text-background rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-border/10">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center relative shrink-0">
              <span className="absolute inset-0 rounded-full border-2 border-green-500 animate-ping opacity-50" />
              <Navigation className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-background/70 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Tracking Active
              </div>
              <div className="text-xl font-bold font-display flex items-baseline gap-2">
                {speed} <span className="text-sm font-normal text-background/60">MPH</span>
              </div>
            </div>
          </div>

          {nextStop && (
            <div className="flex-1 w-full border-t sm:border-t-0 sm:border-l border-background/10 pt-4 sm:pt-0 sm:pl-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-background/70">Next: <span className="text-background font-semibold">{nextStop.name}</span></span>
                <span className="font-bold">{nextStop.distanceFromStart}</span>
              </div>
              <div className="h-2 bg-background/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => {
              setLiveMode(false);
              setCurrentPosition(null);
            }}
            className="w-full sm:w-auto shrink-0"
          >
            End Trip
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
