import { Utensils, Clock, MapPin, RefreshCw } from 'lucide-react';
import { useTripStore } from '@/store/use-trip-store';
import { motion } from 'framer-motion';
import { formatTripTime } from '@/utils/formatTripTime';

export function MealsList() {
  const { plan, previousPlan } = useTripStore();
  if (!plan) return null;

  return (
    <div className="grid gap-6">
      {plan.mealRecommendations.map((meal, idx) => {
        const prevMeal = previousPlan?.mealRecommendations.find(m => m.id === meal.id);
        const isAlternative = previousPlan && !prevMeal;

        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={meal.id} 
            className={`
              rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow
              ${isAlternative ? 'border-primary shadow-primary/10' : 'border-border/60'}
            `}
          >
            {isAlternative && (
              <div className="bg-primary px-4 py-2 flex items-center gap-2 text-primary-foreground text-sm font-bold">
                <RefreshCw className="w-4 h-4" />
                Alternative chosen due to delay
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-3 py-1 bg-accent/20 text-accent-foreground text-xs font-bold uppercase tracking-wider rounded-lg mb-2 inline-block">
                    {meal.mealType}
                  </span>
                  <h3 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-muted-foreground" />
                    {meal.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                    <span>{meal.cuisine}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="font-bold text-foreground">{meal.priceRange}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {meal.location}</span>
                  </div>
                </div>
                
                <div className="text-right bg-muted/30 px-4 py-2 rounded-xl">
                  <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="w-4 h-4" /> Arrival
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {formatTripTime(meal.estimatedArrivalTime)}
                  </div>
                </div>
              </div>

              <p className="text-foreground/80 mb-6">{meal.description}</p>

              <div className="bg-muted/40 rounded-xl p-4">
                <h4 className="text-sm font-bold text-foreground mb-2">Must Try:</h4>
                <div className="flex flex-wrap gap-2">
                  {meal.mustTry.map((item, i) => (
                    <span key={i} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm shadow-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {!meal.isOpen && meal.alternativeOptions && meal.alternativeOptions.length > 0 && (
                <div className="mt-6 border-t border-border pt-6">
                  <h4 className="text-sm font-bold text-destructive mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    Closed at arrival time. Nearby Alternatives:
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {meal.alternativeOptions.map((alt, i) => (
                      <div key={i} className="p-3 border border-border rounded-xl bg-card">
                        <div className="font-bold">{alt.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{alt.cuisine} • {alt.priceRange}</div>
                        <div className="text-sm mt-2 text-foreground/80">{alt.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
