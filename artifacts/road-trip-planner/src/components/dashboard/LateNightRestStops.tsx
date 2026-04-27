import { useEffect, useState } from 'react';
import { useTripStore } from '@/store/use-trip-store';
import {
  Moon, Loader2, BedDouble, Truck, ParkingCircle, Tent,
  Building2, ShieldAlert, ChevronDown, ChevronUp, Wifi,
  Utensils, Fuel, ShowerHead, Coffee, AlertTriangle
} from 'lucide-react';

type RestStop = {
  name: string;
  type: 'motel' | 'rest_area' | 'truck_stop' | 'hotel' | 'campground';
  location: string;
  approximateMileage: string;
  amenities: string[];
  priceRange?: string;
  notes: string;
  recommendedFor: string;
};

type RestStopsData = {
  restStops: RestStop[];
  safetyTip: string;
  drivingAdvice: string;
};

const TYPE_META: Record<RestStop['type'], { label: string; icon: React.ReactNode; color: string }> = {
  motel:      { label: 'Motel',      icon: <BedDouble className="w-4 h-4" />,     color: 'bg-blue-100 text-blue-700' },
  hotel:      { label: 'Hotel',      icon: <Building2 className="w-4 h-4" />,     color: 'bg-violet-100 text-violet-700' },
  rest_area:  { label: 'Rest Area',  icon: <ParkingCircle className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  truck_stop: { label: 'Truck Stop', icon: <Truck className="w-4 h-4" />,         color: 'bg-amber-100 text-amber-700' },
  campground: { label: 'Campground', icon: <Tent className="w-4 h-4" />,          color: 'bg-emerald-100 text-emerald-700' },
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi:      <Wifi className="w-3 h-3" />,
  food:      <Utensils className="w-3 h-3" />,
  fuel:      <Fuel className="w-3 h-3" />,
  shower:    <ShowerHead className="w-3 h-3" />,
  coffee:    <Coffee className="w-3 h-3" />,
  restrooms: <ShowerHead className="w-3 h-3" />,
};

function getAmenityIcon(amenity: string) {
  const lower = amenity.toLowerCase();
  for (const key of Object.keys(AMENITY_ICONS)) {
    if (lower.includes(key)) return AMENITY_ICONS[key];
  }
  return null;
}

function RestStopCard({ stop, index }: { stop: RestStop; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[stop.type];

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-sm transition-shadow">
      <div
        className="flex items-start gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h4 className="font-bold text-foreground leading-tight">{stop.name}</h4>
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${meta.color}`}>
              {meta.icon}{meta.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{stop.location} · {stop.approximateMileage}</p>
          {stop.priceRange && (
            <p className="text-xs font-medium text-primary mt-1">{stop.priceRange}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {stop.amenities.slice(0, 4).map((a, i) => (
              <span key={i} className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {getAmenityIcon(a)}{a}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 space-y-3 bg-muted/20">
          <div className="pt-3 space-y-2">
            <p className="text-sm text-foreground leading-relaxed">{stop.notes}</p>
            <p className="text-xs text-muted-foreground italic">Best for: {stop.recommendedFor}</p>
          </div>
          {stop.amenities.length > 4 && (
            <div className="flex flex-wrap gap-1">
              {stop.amenities.slice(4).map((a, i) => (
                <span key={i} className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {getAmenityIcon(a)}{a}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function isLateNightDeparture(startTime: string): boolean {
  const d = new Date(startTime);
  const hour = d.getUTCHours();
  return hour >= 20 || hour < 6;
}

export function LateNightRestStops() {
  const { request } = useTripStore();
  const [data, setData]       = useState<RestStopsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const isLateNight = isLateNightDeparture(request.startTime);

  useEffect(() => {
    if (!isLateNight || !request.startLocation || !request.destination) return;
    setLoading(true);
    setError(null);

    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    fetch(`${base}/api/ai/rest-stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startLocation: request.startLocation,
        destination: request.destination,
        startTime: request.startTime,
      }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(e => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isLateNight, request.startLocation, request.destination, request.startTime]);

  if (!isLateNight || dismissed) return null;

  return (
    <div className="rounded-2xl border border-amber-300/60 bg-amber-50/80 dark:bg-amber-950/20 overflow-hidden">
      {/* Header banner */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 bg-amber-100/80 dark:bg-amber-900/30 border-b border-amber-300/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">Late-Night Travel Detected</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">Suggested rest stops along your route</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 text-xs font-medium shrink-0"
        >
          Dismiss
        </button>
      </div>

      <div className="p-5 space-y-5">
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-amber-700">
            <Loader2 className="w-7 h-7 animate-spin" />
            <p className="text-sm font-medium">Finding rest stops for your night drive…</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 py-4 text-amber-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Could not load rest stop suggestions. Please try again.</span>
          </div>
        )}

        {data && (
          <>
            {/* Safety tip */}
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-0.5">Safety First</p>
                <p className="text-sm text-red-700">{data.safetyTip}</p>
              </div>
            </div>

            {/* Driving advice */}
            <div className="flex items-start gap-3 bg-amber-100/60 rounded-xl px-4 py-3">
              <Moon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{data.drivingAdvice}</p>
            </div>

            {/* Rest stop cards */}
            <div className="space-y-3">
              {data.restStops.map((stop, i) => (
                <RestStopCard key={i} stop={stop} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
