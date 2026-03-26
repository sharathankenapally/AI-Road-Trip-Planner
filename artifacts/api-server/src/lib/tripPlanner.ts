import { addMinutes, format } from "date-fns";

type VehicleCheckRequest = {
  travelers: number;
  vehicleType: string;
  destination?: string;
};

type VehicleCheckResponse = {
  suitable: boolean;
  suitabilityScore: number;
  issues: string[];
  recommendations: {
    vehicleType: string;
    reason: string;
    capacity: number;
    features: string[];
  }[];
  message: string;
};

type TripPlanRequest = {
  travelers: number;
  vehicleType: string;
  startLocation: string;
  destination: string;
  startTime: string;
  preferences?: string[];
};

type TripPlanResponse = {
  routes: Route[];
  selectedRoute?: Route;
  stops: Stop[];
  mealRecommendations: MealStop[];
  estimatedArrival: string;
  totalDistance: string;
  summary: string;
};

type Route = {
  id: string;
  name: string;
  type: "fastest" | "scenic" | "balanced";
  duration: string;
  distance: string;
  highlights: string[];
  description: string;
};

type Stop = {
  id: string;
  name: string;
  type: "attraction" | "viewpoint" | "rest_area" | "gas_station" | "town" | "landmark";
  description: string;
  estimatedArrivalTime: string;
  estimatedStopDuration: string;
  distanceFromStart: string;
  mustVisit: boolean;
  openHours?: string;
  isOpen: boolean;
  coordinates?: { lat: number; lng: number };
};

type MealStop = {
  id: string;
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  cuisine: string;
  description: string;
  estimatedArrivalTime: string;
  location: string;
  priceRange: "$" | "$$" | "$$$";
  openHours?: string;
  isOpen: boolean;
  mustTry: string[];
  alternativeOptions?: {
    name: string;
    cuisine: string;
    priceRange: string;
    openHours?: string;
    reason: string;
  }[];
};

type TripAdjustRequest = {
  originalRequest: TripPlanRequest;
  delayMinutes: number;
  currentLocation?: string;
  reason?: string;
};

const VEHICLE_DATA: Record<string, { capacity: number; features: string[] }> = {
  sedan: { capacity: 5, features: ["Fuel-efficient", "Comfortable for highways", "Easy parking"] },
  suv: { capacity: 7, features: ["Spacious cargo", "4WD option", "Comfortable for long drives", "Good visibility"] },
  minivan: { capacity: 8, features: ["Maximum passenger space", "Sliding doors", "Lots of storage", "Great for families"] },
  sports_car: { capacity: 2, features: ["Fast", "Fun to drive", "Limited luggage space"] },
  pickup_truck: { capacity: 5, features: ["Large cargo bed", "Towing capacity", "Off-road capable"] },
  motorcycle: { capacity: 2, features: ["Fuel-efficient", "Scenic experience", "Limited luggage"] },
  rv: { capacity: 8, features: ["Built-in sleeping", "Kitchen and bathroom", "Ultimate road trip vehicle", "Self-contained"] },
};

export function checkVehicleSuitability(req: VehicleCheckRequest): VehicleCheckResponse {
  const { travelers, vehicleType } = req;
  const vehicle = VEHICLE_DATA[vehicleType] ?? { capacity: 4, features: [] };
  const capacity = vehicle.capacity;

  const issues: string[] = [];
  let score = 100;

  if (travelers > capacity) {
    issues.push(`Your ${vehicleType} only seats ${capacity} people, but you have ${travelers} travelers`);
    score -= 50;
  } else if (travelers > capacity * 0.8) {
    issues.push(`Your vehicle will be near full capacity — consider a larger option for comfort`);
    score -= 20;
  }

  if (vehicleType === "motorcycle" && travelers > 1) {
    issues.push("Motorcycles are only practical for 1-2 people with minimal luggage");
    score -= 30;
  }
  if (vehicleType === "sports_car" && travelers > 2) {
    issues.push("Sports cars are typically only comfortable for 2 passengers");
    score -= 30;
  }

  const recommendations: VehicleCheckResponse["recommendations"] = [];

  if (travelers > 2 && (vehicleType === "motorcycle" || vehicleType === "sports_car")) {
    recommendations.push({ vehicleType: "sedan", reason: "Comfortable for up to 5 passengers with good fuel economy", capacity: 5, features: VEHICLE_DATA.sedan.features });
  }
  if (travelers > 5) {
    recommendations.push({ vehicleType: "minivan", reason: "Best option for large groups — seats up to 8 with plenty of luggage space", capacity: 8, features: VEHICLE_DATA.minivan.features });
  }
  if (travelers > 2 && travelers <= 7 && vehicleType !== "suv") {
    recommendations.push({ vehicleType: "suv", reason: "Great balance of passenger space, cargo room, and road trip comfort", capacity: 7, features: VEHICLE_DATA.suv.features });
  }
  if (travelers > 4) {
    recommendations.push({ vehicleType: "rv", reason: "Perfect for the ultimate road trip — includes sleeping, kitchen, and bathroom", capacity: 8, features: VEHICLE_DATA.rv.features });
  }

  const suitable = score >= 70;
  const message = suitable
    ? `Your ${vehicleType} is a ${score >= 90 ? "great" : "good"} choice for ${travelers} traveler${travelers > 1 ? "s" : ""}!`
    : `Your ${vehicleType} may not be ideal for ${travelers} traveler${travelers > 1 ? "s" : ""}. Consider one of the alternatives below.`;

  return { suitable, suitabilityScore: Math.max(0, score), issues, recommendations, message };
}

// ─── Geocoding & Routing ────────────────────────────────────────────────────

async function geocode(location: string): Promise<{ lat: number; lng: number; shortName: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&addressdetails=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { headers: { "User-Agent": "RoamRoute/1.0", "Accept-Language": "en" }, signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json() as any[];
    if (!data.length) return null;
    const addr = data[0].address ?? {};
    const shortName = addr.city || addr.town || addr.village || addr.county || addr.state || location;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), shortName };
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}&zoom=10`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { headers: { "User-Agent": "RoamRoute/1.0", "Accept-Language": "en" }, signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json() as any;
    const addr = data.address ?? {};
    return addr.city || addr.town || addr.village || addr.county || addr.state || "Along the Route";
  } catch {
    return "Along the Route";
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolate(lat1: number, lng1: number, lat2: number, lng2: number, t: number) {
  return { lat: lat1 + (lat2 - lat1) * t, lng: lng1 + (lng2 - lng1) * t };
}

async function getRouteInfo(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<{ distanceKm: number; durationMin: number }> {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${from.lng.toFixed(5)},${from.lat.toFixed(5)};${to.lng.toFixed(5)},${to.lat.toFixed(5)}?overview=false`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json() as any;
    if (data.code === "Ok" && data.routes?.length) {
      return { distanceKm: data.routes[0].distance / 1000, durationMin: Math.round(data.routes[0].duration / 60) };
    }
  } catch { /* fall through */ }

  // Fallback: haversine * road-factor of 1.35, avg speed 80 km/h
  const straight = haversineKm(from.lat, from.lng, to.lat, to.lng);
  const distanceKm = straight * 1.35;
  const durationMin = Math.round((distanceKm / 80) * 60);
  return { distanceKm, durationMin };
}

// ─── Time helpers (all UTC to match frontend "wall-clock" UTC display) ───────

function utcHour(d: Date) { return d.getUTCHours(); }
function utcMinutes(d: Date) { return d.getUTCHours() * 60 + d.getUTCMinutes(); }

function isOpenAtTimeUTC(openHours: string, dt: Date): boolean {
  const time = utcMinutes(dt);
  const parse = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + (m || 0); };
  for (const range of openHours.split(",").map(r => r.trim())) {
    const [start, end] = range.split("-").map(s => parse(s.trim()));
    if (time >= start && time <= end) return true;
  }
  return false;
}

function offsetToReachUTCHour(startTime: Date, targetHour: number, tripDurationMin: number): number {
  const startMin = utcMinutes(startTime);
  const targetMin = targetHour * 60;
  let diff = targetMin - startMin;
  if (diff < 0) diff += 24 * 60;
  return diff <= tripDurationMin ? diff : -1;
}

function fmtDuration(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtDistance(km: number): string {
  const miles = km * 0.621371;
  return `${Math.round(miles)} miles`;
}

// ─── Stop content templates ──────────────────────────────────────────────────

type StopTemplate = { name: (place: string) => string; desc: (place: string, distMiles: number) => string; type: Stop["type"]; duration: string; mustVisit: boolean; openHours: string };

const STOP_TEMPLATES: StopTemplate[] = [
  {
    name: p => `${p} Scenic Overlook`,
    desc: (p, d) => `A beautiful panoramic viewpoint ${d} miles from your start, offering sweeping views of the landscape around ${p}. Perfect for photos and a quick stretch of the legs.`,
    type: "viewpoint", duration: "25 min", mustVisit: true, openHours: "0:00-24:00",
  },
  {
    name: p => `${p} Heritage Park`,
    desc: (p, d) => `A charming heritage park in the heart of ${p} (${d} miles from start). Walk around the historic district, grab a coffee, and soak in the local character before continuing your journey.`,
    type: "landmark", duration: "45 min", mustVisit: true, openHours: "8:00-20:00",
  },
  {
    name: p => `${p} Rest Area`,
    desc: (p, d) => `A well-maintained rest area near ${p} (${d} miles from start). Restrooms, picnic tables, and vending machines. A great spot to refuel, stretch, and let everyone recharge.`,
    type: "rest_area", duration: "20 min", mustVisit: false, openHours: "0:00-24:00",
  },
  {
    name: p => `${p} State Nature Reserve`,
    desc: (p, d) => `Stunning natural scenery at the ${p} Nature Reserve, ${d} miles in. Short hiking trails lead to waterfalls and wildlife viewing areas — ideal for families and nature lovers.`,
    type: "attraction", duration: "1 hour", mustVisit: true, openHours: "7:00-19:00",
  },
];

// ─── Main plan generator ─────────────────────────────────────────────────────

export async function generateTripPlan(req: TripPlanRequest): Promise<TripPlanResponse> {
  const isScenic = req.preferences?.includes("scenic");

  // 1. Parse start time — treated as UTC wall-clock (frontend sends without tz conversion)
  const startTime = new Date(req.startTime);

  // 2. Geocode both endpoints in parallel
  const [fromGeo, toGeo] = await Promise.all([geocode(req.startLocation), geocode(req.destination)]);

  // 3. Get real route info
  let distanceKm = 400; // default fallback
  let baseDriveMin = 300;

  if (fromGeo && toGeo) {
    const route = await getRouteInfo(fromGeo, toGeo);
    distanceKm = route.distanceKm;
    // Adjust for scenic detour (+20%) or fastest (-5%)
    baseDriveMin = isScenic ? Math.round(route.durationMin * 1.20) : Math.round(route.durationMin * 1.05);
    if (req.preferences?.includes("fast")) baseDriveMin = Math.round(route.durationMin * 0.95);
  }

  const totalDistMiles = Math.round(distanceKm * 0.621371);
  const scenicDistMiles = Math.round(totalDistMiles * 1.18);
  const balancedDistMiles = Math.round(totalDistMiles * 1.08);

  const fastestMin = Math.round(baseDriveMin * 0.9);
  const balancedMin = baseDriveMin;
  const scenicMin = Math.round(baseDriveMin * 1.20);

  const routes: Route[] = [
    {
      id: "fastest",
      name: "Fastest Route",
      type: "fastest",
      duration: fmtDuration(fastestMin),
      distance: `${Math.round(totalDistMiles)} miles`,
      highlights: ["Interstate highways", "Minimal stops", "Fastest arrival"],
      description: `Take the most direct interstate route from ${req.startLocation} to ${req.destination}. Best for late departures or when time matters most.`,
    },
    {
      id: "scenic",
      name: "Scenic Route",
      type: "scenic",
      duration: fmtDuration(scenicMin),
      distance: `${scenicDistMiles} miles`,
      highlights: ["Scenic byways", "Coastal or mountain views", "Historic towns", "Photo opportunities"],
      description: `Wind through scenic byways and charming small towns on this breathtaking route. Ideal for travelers who enjoy the journey as much as the destination.`,
    },
    {
      id: "balanced",
      name: "Balanced Route",
      type: "balanced",
      duration: fmtDuration(balancedMin),
      distance: `${balancedDistMiles} miles`,
      highlights: ["Mix of highway and scenic roads", "Key attractions", "Good meal options"],
      description: `The best of both worlds — efficient travel with several worthwhile detours. Recommended for most travelers.`,
    },
  ];

  const selectedRoute = routes.find(r => r.id === (isScenic ? "scenic" : "balanced"));
  const driveMinutes = isScenic ? scenicMin : balancedMin;

  // 4. Build stop timeline
  //    Space 3 stops evenly across the drive (at 28%, 52%, 75% of total drive time)
  //    Cumulative driving time accounts for prior stop durations (20 min each on average)
  const stopFractions = [0.28, 0.52, 0.75];
  const stopDurationMin = [25, 45, 20]; // per stop

  // Intermediate place names (reverse geocode mid-points)
  let midPlaces: string[] = ["Midway", "Waypoint", "Junction"];
  if (fromGeo && toGeo) {
    const pts = stopFractions.map(t => interpolate(fromGeo.lat, fromGeo.lng, toGeo.lat, toGeo.lng, t));
    midPlaces = await Promise.all(pts.map(p => reverseGeocode(p.lat, p.lng)));
  }

  // Accumulate offset including stop durations for next stop
  let cumOffset = 0;
  const stops: Stop[] = stopFractions.map((frac, i) => {
    const driveSegment = Math.round(driveMinutes * frac);
    // Cumulative = drive segment + prior stop durations
    const arrivalOffset = driveSegment + stopDurationMin.slice(0, i).reduce((a, b) => a + b, 0);
    cumOffset = arrivalOffset;
    const arrivalTime = addMinutes(startTime, arrivalOffset);
    const distMiles = Math.round(totalDistMiles * frac);
    const tpl = STOP_TEMPLATES[i % STOP_TEMPLATES.length];
    const place = midPlaces[i] || "Midway";

    return {
      id: `stop-${i + 1}`,
      name: tpl.name(place),
      type: tpl.type,
      description: tpl.desc(place, distMiles),
      estimatedArrivalTime: arrivalTime.toISOString(),
      estimatedStopDuration: tpl.duration,
      distanceFromStart: `${distMiles} miles`,
      mustVisit: tpl.mustVisit,
      openHours: tpl.openHours,
      isOpen: isOpenAtTimeUTC(tpl.openHours, arrivalTime),
      coordinates: fromGeo && toGeo
        ? interpolate(fromGeo.lat, fromGeo.lng, toGeo.lat, toGeo.lng, frac)
        : undefined,
    };
  });

  // Total stop time accumulated
  const totalStopMin = stopDurationMin.reduce((a, b) => a + b, 0);
  const totalTripMin = driveMinutes + totalStopMin;
  const arrivalTime = addMinutes(startTime, totalTripMin);

  // 5. Meals — pinned to real UTC clock hours
  const startUTCHour = utcHour(startTime);
  const startUTCMin = utcMinutes(startTime);
  const mealRecommendations: MealStop[] = [];

  const fromName = fromGeo?.shortName ?? req.startLocation;
  const toName = toGeo?.shortName ?? req.destination;

  // BREAKFAST (before 11:00 UTC)
  if (startUTCHour < 11) {
    // Place 45 min after start, but clamp so it doesn't fall at or after 11am
    const maxBreakfastMin = 10 * 60 + 45 - startUTCMin; // latest 10:45am
    const breakfastOffset = Math.min(45, Math.max(15, maxBreakfastMin));
    const breakfastTime = addMinutes(startTime, breakfastOffset);
    if (utcHour(breakfastTime) < 11) {
      mealRecommendations.push({
        id: "meal-breakfast",
        name: "The Morning Roost Diner",
        mealType: "breakfast",
        cuisine: "American Diner",
        description: `A beloved local institution near ${fromName} serving hearty breakfasts since 1958. Famous for fluffy pancakes and fresh-ground coffee.`,
        estimatedArrivalTime: breakfastTime.toISOString(),
        location: `Near ${fromName}, ${Math.round(totalDistMiles * 0.1)} miles from start`,
        priceRange: "$",
        openHours: "6:00-10:59",
        isOpen: isOpenAtTimeUTC("6:00-10:59", breakfastTime),
        mustTry: ["Blue Ribbon Pancakes", "Country Skillet Hash", "Fresh-squeezed OJ"],
        alternativeOptions: [
          { name: "Highway Perk Café", cuisine: "Café", priceRange: "$", openHours: "5:30-10:30", reason: "Opens earlier, great for grab-and-go" },
          { name: "Sunrise Bakery", cuisine: "Bakery", priceRange: "$", openHours: "6:30-10:45", reason: "Famous fresh pastries and local honey" },
        ],
      });
    }
  }

  // LUNCH (12:00–15:59 UTC)
  let lunchOffset = offsetToReachUTCHour(startTime, 12, totalTripMin);
  if (lunchOffset < 0 && startUTCHour >= 12 && startUTCHour < 16) lunchOffset = 20;
  if (lunchOffset >= 0) {
    const lunchTime = addMinutes(startTime, lunchOffset);
    const distAtLunch = Math.round(totalDistMiles * (lunchOffset / totalTripMin));
    // Pick a midway place name
    const lunchPlace = midPlaces[Math.floor(midPlaces.length / 2)] ?? "Midway";
    mealRecommendations.push({
      id: "meal-lunch",
      name: "The Trailhead Bistro",
      mealType: "lunch",
      cuisine: "Farm-to-Table American",
      description: `A charming bistro near ${lunchPlace} sourcing ingredients from local farms. Perfect pit stop with a shaded outdoor patio.`,
      estimatedArrivalTime: lunchTime.toISOString(),
      location: `${lunchPlace}, ~${distAtLunch} miles from start`,
      priceRange: "$$",
      openHours: "12:00-15:59",
      isOpen: isOpenAtTimeUTC("12:00-15:59", lunchTime),
      mustTry: ["Harvest Bowl", "Smoked Brisket Sandwich", "Locally-brewed Root Beer"],
      alternativeOptions: [
        { name: `${lunchPlace} Market Deli`, cuisine: "Deli", priceRange: "$", openHours: "10:00-20:00", reason: "Grab picnic supplies to enjoy at the next stop" },
        { name: "Mama Rosa's Cantina", cuisine: "Mexican", priceRange: "$", openHours: "11:00-21:00", reason: "Consistently rated best tacos on this route" },
      ],
    });
  }

  // DINNER (20:00–22:59 UTC)
  let dinnerOffset = offsetToReachUTCHour(startTime, 20, totalTripMin);
  // If trip ends before 8pm check whether arrival is after 8pm (longer stops etc.)
  if (dinnerOffset < 0) {
    const arr = addMinutes(startTime, totalTripMin);
    if (utcHour(arr) >= 20) dinnerOffset = totalTripMin + 15; // 15 min after arrival
  }
  if (dinnerOffset >= 0) {
    const dinnerTime = addMinutes(startTime, dinnerOffset);
    mealRecommendations.push({
      id: "meal-dinner",
      name: "Summit House Restaurant",
      mealType: "dinner",
      cuisine: "Contemporary American",
      description: `A celebrated destination restaurant near ${toName}. Seasonal menu with breathtaking views — book ahead if possible.`,
      estimatedArrivalTime: dinnerTime.toISOString(),
      location: `Near ${toName}`,
      priceRange: "$$$",
      openHours: "20:00-22:59",
      isOpen: isOpenAtTimeUTC("20:00-22:59", dinnerTime),
      mustTry: ["Dry-Aged Ribeye", "Wild Mushroom Risotto", "Craft Cocktails"],
      alternativeOptions: [
        { name: "The Local Tap", cuisine: "Pub Food", priceRange: "$$", openHours: "20:00-23:59", reason: "Great burgers, local craft beers, no reservation needed" },
        { name: "Golden Dragon", cuisine: "Chinese", priceRange: "$$", openHours: "20:00-23:00", reason: "Authentic flavors, perfect for groups" },
      ],
    });
  }

  return {
    routes,
    selectedRoute,
    stops,
    mealRecommendations,
    estimatedArrival: arrivalTime.toISOString(),
    totalDistance: selectedRoute?.distance ?? `${totalDistMiles} miles`,
    summary: `Your road trip from ${req.startLocation} to ${req.destination} covers approximately ${selectedRoute?.distance ?? totalDistMiles + " miles"} with ${fmtDuration(driveMinutes)} of driving and ${stops.length} planned stops. Estimated arrival at ${format(arrivalTime, "h:mm a 'UTC'")} — enjoy the journey!`,
  };
}

export async function adjustTripPlan(req: TripAdjustRequest): Promise<TripPlanResponse> {
  const { originalRequest, delayMinutes } = req;
  const plan = await generateTripPlan(originalRequest);

  const shiftStop = (stop: Stop): Stop => {
    const newArrival = addMinutes(new Date(stop.estimatedArrivalTime), delayMinutes);
    const newIsOpen = stop.openHours ? isOpenAtTimeUTC(stop.openHours, newArrival) : true;
    if (!newIsOpen && stop.openHours) {
      return { ...stop, estimatedArrivalTime: newArrival.toISOString(), isOpen: false, description: `[CLOSED at updated arrival time] ${stop.description}. Consider a nearby open attraction instead.` };
    }
    return { ...stop, estimatedArrivalTime: newArrival.toISOString(), isOpen: newIsOpen };
  };

  const shiftMeal = (meal: MealStop): MealStop => {
    const newArrival = addMinutes(new Date(meal.estimatedArrivalTime), delayMinutes);
    const newIsOpen = meal.openHours ? isOpenAtTimeUTC(meal.openHours, newArrival) : true;
    if (!newIsOpen) {
      const alt = meal.alternativeOptions?.[0];
      if (alt?.openHours && isOpenAtTimeUTC(alt.openHours, newArrival)) {
        return {
          ...meal, id: `${meal.id}-alt`, name: alt.name, cuisine: alt.cuisine,
          priceRange: alt.priceRange as "$" | "$$" | "$$$", openHours: alt.openHours,
          isOpen: true, estimatedArrivalTime: newArrival.toISOString(),
          description: `[Switched from ${meal.name} — now closed] ${alt.reason}`,
          mustTry: meal.mustTry, alternativeOptions: meal.alternativeOptions?.slice(1),
        };
      }
      return { ...meal, estimatedArrivalTime: newArrival.toISOString(), isOpen: false, description: `[CLOSED at updated arrival time] ${meal.description}. Check the alternatives below.` };
    }
    return { ...meal, estimatedArrivalTime: newArrival.toISOString(), isOpen: newIsOpen };
  };

  const newArrival = addMinutes(new Date(plan.estimatedArrival), delayMinutes);
  return { ...plan, stops: plan.stops.map(shiftStop), mealRecommendations: plan.mealRecommendations.map(shiftMeal), estimatedArrival: newArrival.toISOString(), summary: `[Updated after ${delayMinutes}-minute delay] ${plan.summary}` };
}
