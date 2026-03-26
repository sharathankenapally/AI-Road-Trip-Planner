import { useState } from 'react';
import { useTripStore } from '@/store/use-trip-store';
import { useGetTrafficInfo, TrafficRequestRouteType } from '@workspace/api-client-react';
import { AlertTriangle, Car, Construction, CloudRain, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TrafficPanel() {
  const { request } = useTripStore();
  
  const trafficQuery = useGetTrafficInfo();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkTraffic = () => {
    trafficQuery.mutate({
      data: {
        startLocation: request.startLocation,
        destination: request.destination,
        routeType: TrafficRequestRouteType.balanced
      }
    }, {
      onSuccess: () => {
        setLastChecked(new Date());
      }
    });
  };

  const getConditionColor = (condition?: string) => {
    switch(condition) {
      case 'clear': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'light': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'moderate': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'heavy': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'severe': return 'text-red-700 bg-red-700/10 border-red-700/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getIncidentIcon = (type: string) => {
    switch(type) {
      case 'accident': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'construction': return <Construction className="w-4 h-4 text-orange-500" />;
      case 'weather': return <CloudRain className="w-4 h-4 text-blue-500" />;
      case 'congestion': return <Car className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const traffic = trafficQuery.data;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold font-display flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          Traffic Conditions
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkTraffic}
          disabled={trafficQuery.isPending}
          className="hover-elevate"
        >
          {trafficQuery.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Check Traffic
        </Button>
      </div>

      {!traffic && !trafficQuery.isPending && (
        <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-xl">
          <p className="text-sm">Click 'Check Traffic' to see current route conditions.</p>
        </div>
      )}

      {traffic && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold capitalize ${getConditionColor(traffic.conditions)}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {traffic.conditions}
            </div>
            
            <div className="flex-1 bg-muted/50 rounded-xl p-3 flex justify-between items-center">
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Est. Delay</div>
                <div className={`text-xl font-bold ${traffic.delayMinutes > 15 ? 'text-destructive' : 'text-foreground'}`}>
                  {traffic.delayMinutes > 0 ? `+${traffic.delayMinutes} mins` : 'None'}
                </div>
              </div>
              {traffic.delayMinutes > 15 && (
                <div className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">
                  Adjustment Recommended
                </div>
              )}
            </div>
          </div>

          {traffic.incidents.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Reported Incidents</h4>
              {traffic.incidents.map((inc, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background text-sm">
                  <div className="mt-0.5">{getIncidentIcon(inc.type)}</div>
                  <div>
                    <div className="font-semibold capitalize">{inc.type} • {inc.location}</div>
                    <div className="text-muted-foreground">{inc.description}</div>
                    <div className="text-xs font-medium text-destructive mt-1">Delay: {inc.delayMinutes}m</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-lg text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> No incidents reported on your route.
            </div>
          )}

          {lastChecked && (
            <div className="text-xs text-muted-foreground text-right">
              Last updated: {lastChecked.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
