import { motion } from 'framer-motion';
import { useTripStore } from '@/store/use-trip-store';
import { useLocation } from 'wouter';
import { Clock, Map, Sparkles, Navigation } from 'lucide-react';
import type { Route } from '@workspace/api-client-react';

export function Step3Routes() {
  const { plan, setPlan } = useTripStore();
  const [, setLocation] = useLocation();

  if (!plan) return null;

  const handleSelectRoute = (route: Route) => {
    // In a real app we might call a backend to confirm, but here we update the store
    setPlan({ ...plan, selectedRoute: route });
    setLocation('/dashboard');
  };

  const getRouteIcon = (type: string) => {
    switch(type) {
      case 'fastest': return <Clock className="w-6 h-6 text-blue-500" />;
      case 'scenic': return <Sparkles className="w-6 h-6 text-accent" />;
      default: return <Map className="w-6 h-6 text-secondary" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">Choose your path</h2>
        <p className="text-muted-foreground mt-2">We found {plan.routes.length} great ways to get there.</p>
      </div>

      <div className="grid gap-6">
        {plan.routes.map((route, idx) => (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={route.id}
            onClick={() => handleSelectRoute(route)}
            className="group w-full text-left bg-card p-6 rounded-2xl border-2 border-border hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Navigation className="w-32 h-32 text-primary" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-muted rounded-xl">
                  {getRouteIcon(route.type)}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display">{route.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {route.duration}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{route.distance}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-foreground mb-6 leading-relaxed">
                {route.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {route.highlights.map((hl, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary/10 text-secondary-foreground text-xs font-bold uppercase tracking-wider rounded-lg">
                    {hl}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
