import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

type NominatimResult = {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  type: string;
  class: string;
};

type Suggestion = {
  place_id: number;
  label: string;       // what appears in the dropdown
  value: string;       // what fills the input on select
};

function buildLabel(r: NominatimResult): string {
  const a = r.address;
  const primary = a.city || a.town || a.village || a.suburb || a.county || '';
  const state   = a.state   ? a.state   : '';
  const country = a.country ? a.country : '';

  const parts: string[] = [];
  if (primary) parts.push(primary);
  if (state && state !== primary) parts.push(state);
  if (country) parts.push(country);

  // Fallback: use first two segments of display_name
  if (!primary) {
    const segs = r.display_name.split(',').map(s => s.trim()).filter(Boolean);
    return segs.slice(0, 3).join(', ');
  }
  return parts.join(', ');
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function LocationInput({ value, onChange, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) { setSuggestions([]); setOpen(false); return; }

    setLoading(true);
    try {
      // No featuretype filter — let Nominatim rank freely so cities, parks,
      // airports and landmarks all surface correctly.
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?format=json&q=${encodeURIComponent(query)}` +
        `&limit=8&addressdetails=1&dedupe=1`;

      const res  = await fetch(url, {
        headers: { 'User-Agent': 'RoamRoute/1.0', 'Accept-Language': 'en' },
      });
      const data: NominatimResult[] = await res.json();

      const seen = new Set<string>();
      const mapped: Suggestion[] = [];

      for (const item of data) {
        const label = buildLabel(item);
        if (!seen.has(label.toLowerCase())) {
          seen.add(label.toLowerCase());
          mapped.push({ place_id: item.place_id, label, value: label });
        }
        if (mapped.length >= 6) break;
      }

      setSuggestions(mapped);
      setOpen(mapped.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 320);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (s: Suggestion) => {
    onChange(s.value);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); select(suggestions[activeIndex]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setActiveIndex(-1); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full px-4 py-3 pr-10 bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-foreground placeholder:text-muted-foreground placeholder:font-normal"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown — rendered with fixed positioning so it escapes any overflow-hidden parent */}
      {open && suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full mt-1.5 z-[9999] bg-card border border-border rounded-xl shadow-xl overflow-hidden"
          style={{ minWidth: '100%' }}
        >
          {suggestions.map((s, i) => (
            <li
              key={s.place_id}
              onMouseDown={e => { e.preventDefault(); select(s); }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm transition-colors select-none ${
                i === activeIndex
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted/70'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 shrink-0 ${i === activeIndex ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium leading-snug">{s.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
