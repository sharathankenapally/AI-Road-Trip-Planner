import { useState } from 'react';
import { useTripStore } from '@/store/use-trip-store';
import { useSearchNearbyPlaces, NearbyPlacesRequestCategoriesItem } from '@workspace/api-client-react';
import { MapPin, Search, Plus, Star, Coffee, Utensils, Fuel, Tent, Bed, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export function NearbyPlaces() {
  const { request, addCustomStop } = useTripStore();
  const searchPlaces = useSearchNearbyPlaces();
  
  const [selectedCategory, setSelectedCategory] = useState<NearbyPlacesRequestCategoriesItem>(NearbyPlacesRequestCategoriesItem.restaurant);
  const [openOnly, setOpenOnly] = useState(false);

  const categories = Object.values(NearbyPlacesRequestCategoriesItem);

  const handleSearch = () => {
    searchPlaces.mutate({
      data: {
        location: request.startLocation, // In a real app, this might be current GPS
        categories: [selectedCategory],
        openNow: openOnly
      }
    });
  };

  const handleAddStop = (place: any) => {
    addCustomStop({
      id: place.id || Math.random().toString(),
      name: place.name,
      type: 'custom',
      description: place.description || place.address,
      estimatedArrivalTime: new Date().toISOString(), // Mock time
      estimatedStopDuration: '1h',
      distanceFromStart: place.distance,
      mustVisit: false,
      isOpen: place.isOpen,
      coordinates: place.coordinates
    });
    toast({ title: `${place.name} added to your stops!` });
  };

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'restaurant': return <Utensils className="w-4 h-4" />;
      case 'coffee': return <Coffee className="w-4 h-4" />;
      case 'gas_station': return <Fuel className="w-4 h-4" />;
      case 'hotel': return <Bed className="w-4 h-4" />;
      case 'attraction': return <Navigation className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold font-display flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Nearby Places
        </h3>
        
        <div className="flex items-center gap-3">
          <label className="text-sm flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={openOnly} 
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="rounded text-primary focus:ring-primary accent-primary"
            />
            Open Now
          </label>
          <Button 
            onClick={handleSearch} 
            disabled={searchPlaces.isPending}
            size="sm"
            className="hover-elevate"
          >
            {searchPlaces.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Search Area
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 transition-colors border
              ${selectedCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-muted-foreground border-border'}
            `}
          >
            {getCategoryIcon(cat)}
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchPlaces.data?.places.map((place, i) => (
          <div key={i} className="border border-border/50 rounded-xl p-4 flex flex-col bg-background hover:border-primary/30 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-sm leading-tight pr-2">{place.name}</h4>
              <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${place.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            
            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
              <span>{place.distance}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              {place.rating && (
                <span className="flex items-center gap-0.5 text-yellow-600 font-medium">
                  {place.rating} <Star className="w-3 h-3 fill-current" />
                </span>
              )}
              {place.priceLevel && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="font-medium text-foreground">{'$'.repeat(place.priceLevel)}</span>
                </>
              )}
            </div>
            
            <p className="text-xs text-foreground/70 mb-4 line-clamp-2 flex-1">{place.description}</p>
            
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover-elevate"
              onClick={() => handleAddStop(place)}
            >
              <Plus className="w-3 h-3 mr-1" /> Add to Trip
            </Button>
          </div>
        ))}

        {!searchPlaces.data && !searchPlaces.isPending && (
          <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/20 rounded-xl">
            Select a category and search to find places near your location.
          </div>
        )}
      </div>
    </div>
  );
}
