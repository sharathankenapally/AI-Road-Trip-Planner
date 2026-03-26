import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTripStore } from '@/store/use-trip-store';
import { MapPin } from 'lucide-react';
import { formatTripTime } from '@/utils/formatTripTime';

// Fix Leaflet's default icon path issues in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom colored icons
const createIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const blueIcon = createIcon('blue');
const orangeIcon = createIcon('orange');
const greenIcon = createIcon('green');
const redIcon = createIcon('red'); // for meals

// Define a pulsing dot icon for current position
const pulseIcon = L.divIcon({
  className: 'custom-pulse-icon',
  html: '<div class="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_0_4px_rgba(59,130,246,0.3)] animate-pulse border-2 border-white"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Component to handle map center changes
function MapController({ center, bounds }: { center?: [number, number], bounds?: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, map.getZoom());
    }
  }, [map, center, bounds]);
  return null;
}

export function MapView() {
  const { plan, currentPosition } = useTripStore();
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

  if (!plan) return null;

  const validStops = plan.stops.filter(s => s.coordinates && s.coordinates.lat && s.coordinates.lng);
  
  // Extract route path if we have start and end coords, maybe some stops
  // Since we only have stop coordinates, we'll draw a basic polyline between stops
  const routeCoordinates: [number, number][] = validStops.map(s => [s.coordinates!.lat, s.coordinates!.lng]);

  useEffect(() => {
    if (routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      if (currentPosition) {
        bounds.extend([currentPosition.lat, currentPosition.lng]);
      }
      setMapBounds(bounds);
    } else if (currentPosition) {
      setMapBounds(L.latLngBounds([[currentPosition.lat, currentPosition.lng], [currentPosition.lat, currentPosition.lng]]));
    }
  }, [plan.stops, currentPosition]);

  const defaultCenter: [number, number] = routeCoordinates.length > 0 
    ? routeCoordinates[0] 
    : (currentPosition ? [currentPosition.lat, currentPosition.lng] : [39.8283, -98.5795]); // US center

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-border/60 shadow-inner relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={routeCoordinates.length > 0 ? undefined : 4} 
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {mapBounds && <MapController bounds={mapBounds} />}
        
        {routeCoordinates.length > 1 && (
          <Polyline 
            positions={routeCoordinates} 
            pathOptions={{ color: 'hsl(var(--primary))', weight: 4, opacity: 0.7, dashArray: '8, 8' }} 
          />
        )}

        {/* Current Position */}
        {currentPosition && (
          <Marker position={[currentPosition.lat, currentPosition.lng]} icon={pulseIcon}>
            <Popup>
              <div className="font-bold">You are here</div>
            </Popup>
          </Marker>
        )}

        {/* Stops */}
        {validStops.map(stop => {
          let icon = blueIcon;
          if (stop.isCustom) icon = greenIcon;
          else if (stop.mustVisit) icon = orangeIcon;

          return (
            <Marker 
              key={stop.id} 
              position={[stop.coordinates!.lat, stop.coordinates!.lng]}
              icon={icon}
            >
              <Popup className="rounded-xl">
                <div className="min-w-[150px]">
                  <h4 className="font-bold font-display text-base">{stop.name}</h4>
                  <div className="text-xs text-muted-foreground capitalize mb-2">{stop.type.replace('_', ' ')}</div>
                  <div className="text-sm flex items-center justify-between mt-2 pt-2 border-t">
                    <span>{formatTripTime(stop.estimatedArrivalTime)}</span>
                    <span className={`text-xs font-bold ${stop.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                      {stop.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
