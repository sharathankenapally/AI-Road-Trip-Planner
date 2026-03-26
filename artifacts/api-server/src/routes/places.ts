import { Router, type IRouter } from "express";
import { SearchNearbyPlacesBody } from "@workspace/api-zod";

const router: IRouter = Router();

const PLACES_DB: Record<string, {
  id: string; name: string; category: string; description: string;
  address: string; openHours: string; rating: number; priceLevel: number;
  tags: string[]; coordinates?: { lat: number; lng: number };
}[]> = {
  restaurant: [
    { id: "p1", name: "The Road House Grill", category: "restaurant", description: "Classic American comfort food with a friendly atmosphere", address: "Main Street", openHours: "10:00-22:00", rating: 4.3, priceLevel: 2, tags: ["burgers", "comfort food", "family friendly"] },
    { id: "p2", name: "Mountain Brew Coffee", category: "restaurant", description: "Artisan coffee and fresh pastries, perfect pit stop", address: "Highway 1", openHours: "6:00-18:00", rating: 4.6, priceLevel: 1, tags: ["coffee", "pastries", "quick stop"] },
    { id: "p3", name: "Sunset Cantina", category: "restaurant", description: "Authentic Mexican cuisine with local ingredients", address: "Oak Street", openHours: "11:00-21:00", rating: 4.4, priceLevel: 2, tags: ["mexican", "tacos", "margaritas"] },
    { id: "p4", name: "The Farm Table", category: "restaurant", description: "Farm-to-table dining with seasonal menus", address: "County Road", openHours: "11:30-21:30", rating: 4.7, priceLevel: 3, tags: ["farm-to-table", "local", "healthy"] },
  ],
  gas_station: [
    { id: "g1", name: "Highway Fuel & Mart", category: "gas_station", description: "Full service fuel station with convenience store", address: "Highway Junction", openHours: "0:00-24:00", rating: 3.8, priceLevel: 2, tags: ["fuel", "convenience", "snacks"] },
    { id: "g2", name: "Quick Stop Gas", category: "gas_station", description: "Budget-friendly fuel with EV charging stations", address: "Route 66", openHours: "0:00-24:00", rating: 4.0, priceLevel: 1, tags: ["fuel", "EV charging", "affordable"] },
  ],
  attraction: [
    { id: "a1", name: "Vista Point Overlook", category: "attraction", description: "Stunning panoramic views popular with photographers", address: "Scenic Byway", openHours: "0:00-24:00", rating: 4.9, priceLevel: 1, tags: ["views", "photography", "scenic"] },
    { id: "a2", name: "Pioneer Heritage Museum", category: "attraction", description: "Award-winning museum showcasing local pioneer history", address: "Main Street", openHours: "9:00-17:00", rating: 4.5, priceLevel: 1, tags: ["history", "museum", "educational"] },
    { id: "a3", name: "Riverside Nature Park", category: "attraction", description: "Beautiful riverside trails and picnic areas", address: "Park Road", openHours: "7:00-20:00", rating: 4.6, priceLevel: 1, tags: ["nature", "hiking", "picnic"] },
    { id: "a4", name: "Historic Downtown District", category: "attraction", description: "Charming historic district with shops and galleries", address: "Old Town", openHours: "9:00-21:00", rating: 4.3, priceLevel: 2, tags: ["shopping", "history", "arts"] },
  ],
  rest_area: [
    { id: "r1", name: "Valley Rest Stop", category: "rest_area", description: "Clean facilities with picnic tables and vending machines", address: "Highway Mile 145", openHours: "0:00-24:00", rating: 3.5, priceLevel: 1, tags: ["restrooms", "picnic", "accessible"] },
    { id: "r2", name: "Mountain Pass Rest Area", category: "rest_area", description: "Scenic rest area with interpretive trail information", address: "Summit Road", openHours: "0:00-24:00", rating: 4.0, priceLevel: 1, tags: ["restrooms", "scenic", "information boards"] },
  ],
  hotel: [
    { id: "h1", name: "The Grand Roadside Inn", category: "hotel", description: "Comfortable highway hotel with pool and breakfast included", address: "Interstate Exit 23", openHours: "0:00-24:00", rating: 4.1, priceLevel: 2, tags: ["pool", "breakfast", "highway access"] },
    { id: "h2", name: "Mountain Lodge & Spa", category: "hotel", description: "Rustic luxury lodge with spa services and mountain views", address: "Mountain Drive", openHours: "0:00-24:00", rating: 4.8, priceLevel: 4, tags: ["luxury", "spa", "mountain views"] },
  ],
  coffee: [
    { id: "c1", name: "The Traveler's Cup", category: "coffee", description: "Specialty coffee with free WiFi and comfortable seating", address: "Main Street", openHours: "6:00-20:00", rating: 4.5, priceLevel: 2, tags: ["specialty coffee", "WiFi", "seating"] },
    { id: "c2", name: "Highway Espresso", category: "coffee", description: "Drive-through espresso bar, ideal for on-the-go", address: "Highway 1", openHours: "5:30-19:00", rating: 4.2, priceLevel: 1, tags: ["drive-through", "quick", "espresso"] },
  ],
  grocery: [
    { id: "gr1", name: "Trail's End Market", category: "grocery", description: "Local grocery with deli, fresh produce, and trail snacks", address: "Center Street", openHours: "7:00-22:00", rating: 4.3, priceLevel: 2, tags: ["fresh produce", "deli", "snacks"] },
  ],
};

function isOpenAtTime(openHours: string, dt: Date): boolean {
  const hour = dt.getHours();
  const min = dt.getMinutes();
  const time = hour * 60 + min;
  const parse = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const ranges = openHours.split(",").map((r) => r.trim());
  for (const range of ranges) {
    const [start, end] = range.split("-").map((s) => parse(s.trim()));
    if (time >= start && time <= end) return true;
  }
  return false;
}

router.post("/nearby", (req, res) => {
  const parsed = SearchNearbyPlacesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data as { location: string; radius?: number; categories?: string[]; openNow?: boolean; currentTime?: string };
  const { location, categories, openNow, currentTime } = data;

  const checkTime = currentTime ? new Date(currentTime) : new Date();
  const requestedCats = categories && categories.length > 0
    ? categories
    : ["restaurant", "attraction", "gas_station", "rest_area"];

  const places = requestedCats.flatMap((cat) => {
    const catPlaces = PLACES_DB[cat] ?? [];
    return catPlaces.map((p) => {
      const isOpen = isOpenAtTime(p.openHours, checkTime);
      const distanceMiles = (Math.random() * 8 + 0.5).toFixed(1);
      return {
        ...p,
        address: `${p.address}, near ${location}`,
        distance: `${distanceMiles} miles`,
        isOpen,
        coordinates: { lat: 37.5 + (Math.random() - 0.5) * 0.5, lng: -120 + (Math.random() - 0.5) * 0.5 },
      };
    });
  });

  const filtered = openNow ? places.filter((p) => p.isOpen) : places;
  filtered.sort(() => Math.random() - 0.5);

  res.json({
    places: filtered.slice(0, 12),
    searchLocation: location,
    totalFound: filtered.length,
  });
});

export default router;
