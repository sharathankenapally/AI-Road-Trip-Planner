import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Car, CarFront, Truck, Bike, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useTripStore } from '@/store/use-trip-store';
import { useCheckVehicle } from '@workspace/api-client-react';

const VEHICLES = [
  { id: 'sedan', label: 'Sedan', icon: Car, capacity: 4 },
  { id: 'suv', label: 'SUV', icon: CarFront, capacity: 5 },
  { id: 'minivan', label: 'Minivan', icon: Truck, capacity: 7 },
  { id: 'sports_car', label: 'Sports Car', icon: Car, capacity: 2 },
  { id: 'pickup_truck', label: 'Pickup', icon: Truck, capacity: 4 },
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike, capacity: 2 },
  { id: 'rv', label: 'RV', icon: Truck, capacity: 6 },
];

export function Step1Vehicle({ onNext }: { onNext: () => void }) {
  const { request, updateRequest } = useTripStore();
  const checkVehicle = useCheckVehicle();
  const [issues, setIssues] = useState<any>(null);

  const handleContinue = () => {
    checkVehicle.mutate({
      data: {
        travelers: request.travelers,
        vehicleType: request.vehicleType,
        destination: request.destination || undefined
      }
    }, {
      onSuccess: (res) => {
        if (res.suitable) {
          onNext();
        } else {
          setIssues(res);
        }
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">Who's going?</h2>
        <p className="text-muted-foreground mt-2">Let's start with your crew and your ride.</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Number of Travelers
        </label>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => updateRequest({ travelers: Math.max(1, request.travelers - 1) })}
            className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center text-xl hover:border-primary hover:text-primary transition-colors focus:outline-none"
          >
            -
          </button>
          <span className="text-3xl font-display font-bold w-12 text-center">{request.travelers}</span>
          <button 
            onClick={() => updateRequest({ travelers: Math.min(10, request.travelers + 1) })}
            className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center text-xl hover:border-primary hover:text-primary transition-colors focus:outline-none"
          >
            +
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-foreground">Select Vehicle Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {VEHICLES.map((v) => {
            const Icon = v.icon;
            const isSelected = request.vehicleType === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  updateRequest({ vehicleType: v.id });
                  setIssues(null);
                }}
                className={`
                  relative p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 outline-none
                  ${isSelected 
                    ? 'bg-primary/5 border-2 border-primary shadow-md shadow-primary/10' 
                    : 'bg-card border-2 border-border/50 hover:border-primary/50 hover:bg-muted/30 shadow-sm'}
                `}
              >
                <Icon className={`w-8 h-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-semibold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {v.label}
                </span>
                <span className="text-xs text-muted-foreground absolute top-3 right-3 bg-background/80 px-2 py-0.5 rounded-full border border-border">
                  Up to {v.capacity}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {issues && !issues.suitable && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 overflow-hidden"
        >
          <div className="flex items-start gap-3 text-amber-800">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-lg">{issues.message}</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-amber-700/80">
                {issues.issues.map((iss: string, i: number) => <li key={i}>{iss}</li>)}
              </ul>
              
              <div className="mt-4 space-y-3">
                <p className="font-semibold text-sm uppercase tracking-wider text-amber-800/60">Recommended Alternatives</p>
                {issues.recommendations.map((rec: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      updateRequest({ vehicleType: rec.vehicleType });
                      setIssues(null);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-white/60 hover:bg-white rounded-xl border border-amber-200/50 transition-colors text-left group"
                  >
                    <div>
                      <span className="font-bold block text-foreground capitalize">{rec.vehicleType.replace('_', ' ')}</span>
                      <span className="text-sm text-muted-foreground">{rec.reason}</span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="pt-6 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={checkVehicle.isPending}
          className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
        >
          {checkVehicle.isPending ? (
            <span className="animate-pulse">Checking...</span>
          ) : issues ? (
            <>Proceed Anyway <ArrowRight className="w-5 h-5" /></>
          ) : (
            <>Continue <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </motion.div>
  );
}
