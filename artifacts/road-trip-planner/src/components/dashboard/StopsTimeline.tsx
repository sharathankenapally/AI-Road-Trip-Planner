import { MapPin, Camera, Coffee, Fuel, Tent, Navigation, CheckCircle } from 'lucide-react';
import { useTripStore } from '@/store/use-trip-store';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

export function StopsTimeline() {
  const { plan, previousPlan } = useTripStore();
  if (!plan) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'attraction': return <Camera className="w-5 h-5" />;
      case 'viewpoint': return <Navigation className="w-5 h-5" />;
      case 'rest_area': return <Coffee className="w-5 h-5" />;
      case 'gas_station': return <Fuel className="w-5 h-5" />;
      case 'landmark': return <Tent className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <div className="py-6 pl-4 sm:pl-8 border-l-2 border-primary/20 space-y-12 relative">
      {plan.stops.map((stop, idx) => {
        // Visual Diff Logic
        const prevStop = previousPlan?.stops.find(s => s.id === stop.id);
        const isNew = previousPlan && !prevStop;
        const timeChanged = prevStop && prevStop.estimatedArrivalTime !== stop.estimatedArrivalTime;
        const wasClosed = prevStop && !prevStop.isOpen && stop.isOpen;
        
        const isDiff = isNew || timeChanged || wasClosed;

        return (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stop.id} 
            className="relative"
          >
            {/* Timeline dot */}
            <div className={`
              absolute -left-[3.5rem] sm:-left-[4.5rem] w-12 h-12 rounded-full border-4 border-background flex items-center justify-center text-white shadow-md
              ${stop.isOpen ? 'bg-secondary' : 'bg-destructive'}
              ${isDiff ? 'ring-4 ring-accent/30 bg-accent' : ''}
            `}>
              {getIcon(stop.type)}
            </div>

            <div className={`
              bg-card rounded-2xl p-6 border transition-all hover:shadow-md
              ${isDiff ? 'border-accent/50 bg-accent/5' : 'border-border/50'}
            `}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold font-display text-foreground">{stop.name}</h3>
                    {stop.mustVisit && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold uppercase rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Must Visit
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{stop.type.replace('_', ' ')} • {stop.distanceFromStart}</p>
                </div>
                
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-foreground">
                    {format(parseISO(stop.estimatedArrivalTime), 'h:mm a')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Stop: {stop.estimatedStopDuration}
                  </div>
                </div>
              </div>

              <p className="text-foreground/80 text-sm leading-relaxed mb-4">
                {stop.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stop.isOpen ? 'bg-secondary' : 'bg-destructive animate-pulse'}`} />
                  <span className="text-sm font-semibold">
                    {stop.isOpen ? 'Currently Open' : 'Closed at arrival time'}
                  </span>
                  {stop.openHours && <span className="text-sm text-muted-foreground hidden sm:inline">({stop.openHours})</span>}
                </div>
                
                {isDiff && (
                  <span className="text-xs font-bold text-accent-foreground bg-accent/20 px-3 py-1 rounded-full">
                    {isNew ? 'Added to Plan' : 'Time Adjusted'}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
