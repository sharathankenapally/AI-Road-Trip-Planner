import { useEffect, useState } from 'react';
import { useTripStore } from '@/store/use-trip-store';
import { Loader2, MapPin, Star, Clock, Lightbulb, ChevronDown, ChevronUp, Flag } from 'lucide-react';

type Place = {
  name: string;
  category: string;
  location?: string;
  description: string;
  why: string;
  estimatedTime: string;
  approximateDistance?: string;
  tips?: string;
};

type MustVisitData = {
  enRoute: Place[];
  atDestination: Place[];
  destinationOverview: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  museum:     'bg-purple-100 text-purple-700',
  park:       'bg-green-100 text-green-700',
  landmark:   'bg-amber-100 text-amber-700',
  beach:      'bg-cyan-100 text-cyan-700',
  temple:     'bg-orange-100 text-orange-700',
  fort:       'bg-stone-100 text-stone-700',
  viewpoint:  'bg-sky-100 text-sky-700',
  market:     'bg-pink-100 text-pink-700',
  garden:     'bg-lime-100 text-lime-700',
  waterfall:  'bg-blue-100 text-blue-700',
  palace:     'bg-yellow-100 text-yellow-700',
  historic:   'bg-rose-100 text-rose-700',
  nature:     'bg-emerald-100 text-emerald-700',
  religious:  'bg-indigo-100 text-indigo-700',
  default:    'bg-muted text-muted-foreground',
};

function getCategoryColor(cat: string) {
  const lower = cat.toLowerCase();
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (lower.includes(key)) return CATEGORY_COLORS[key];
  }
  return CATEGORY_COLORS.default;
}

function PlaceCard({ place, index }: { place: Place; index: number }) {
  const [expanded, setExpanded] = useState(false);
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
            <h4 className="font-bold text-foreground leading-tight">{place.name}</h4>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${getCategoryColor(place.category)}`}>
              {place.category}
            </span>
          </div>
          {place.location && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />{place.location}
              {place.approximateDistance && <span className="ml-1">· {place.approximateDistance}</span>}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{place.description}</p>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 space-y-3 bg-muted/20">
          <div className="flex items-start gap-2 pt-3">
            <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Why Visit</p>
              <p className="text-sm text-foreground">{place.why}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm text-foreground"><span className="font-medium">Time needed:</span> {place.estimatedTime}</p>
          </div>
          {place.tips && (
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Tip</p>
                <p className="text-sm text-foreground">{place.tips}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MustVisitPlaces() {
  const { request } = useTripStore();
  const [data, setData]       = useState<MustVisitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!request.startLocation || !request.destination) return;
    setLoading(true);
    setError(null);

    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    fetch(`${base}/api/ai/must-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startLocation: request.startLocation,
        destination: request.destination,
      }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(e => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [request.startLocation, request.destination]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-medium">Finding must-visit places along your route…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Could not load must-visit places. Please try again.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Destination overview */}
      {data.destinationOverview && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-wide">About {request.destination}</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{data.destinationOverview}</p>
        </div>
      )}

      {/* En-route places */}
      {data.enRoute.length > 0 && (
        <div>
          <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-amber-500" />
            Along the Way
            <span className="text-sm font-normal text-muted-foreground ml-1">({data.enRoute.length} places)</span>
          </h3>
          <div className="space-y-3">
            {data.enRoute.map((p, i) => <PlaceCard key={i} place={p} index={i} />)}
          </div>
        </div>
      )}

      {/* At destination */}
      {data.atDestination.length > 0 && (
        <div>
          <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-primary" />
            At {request.destination}
            <span className="text-sm font-normal text-muted-foreground ml-1">({data.atDestination.length} places)</span>
          </h3>
          <div className="space-y-3">
            {data.atDestination.map((p, i) => <PlaceCard key={i} place={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
